import type { CachedArticleRepository, Article } from '@/domain/models/Article';
import {
  ArticleNotFoundError,
  NullArticle,
  CachedArticleNotFoundError,
} from '@/domain/models/Article';
import type { ImageCache } from '@/domain/models/Image';
import { updateCache } from '@/domain/services/Cache/ArticleCache/updateCache';
import type { GetImageSrcsInHtml } from '@/domain/services/Cache/GetImageSrcsInHtml';
import type { ReplaceImageSrcsInHtml } from '@/domain/services/Cache/ReplaceImageSrcsInHtml';
import { retryUntilSuccess } from '@/domain/services/Cache/retryUntilSuccess';
import type { Getter } from '@/domain/services/Cache/Getter';

type SingleCallback = (res: Article) => void;
type Callback = (res: Article[]) => void;

function isStale(sourceResult: Article[], cacheResult: Article[]): boolean {
  // check to make sure the number of results are the same
  if (sourceResult.length !== cacheResult.length) return true;

  // look for deleted or newly created articles
  const sourceArticleIds = new Set(
    sourceResult.map((r) => r.getId().toString())
  );
  const cacheArticleIds = new Set(cacheResult.map((r) => r.getId().toString()));
  const inSourceNotCache = [...sourceArticleIds.values()].find(
    (id) => !cacheArticleIds.has(id)
  );
  const inCacheNotSource = [...cacheArticleIds.values()].find(
    (id) => !sourceArticleIds.has(id)
  );
  if (inSourceNotCache !== undefined || inCacheNotSource !== undefined)
    return true;

  // look for cached articles that are older than lastUpdated date.
  type ResultsById = {
    [key: string]: {
      sourceResult: Article | null;
      cacheResult: Article | null;
    };
  };
  // 1. group by id into an object keyed by id, values are {source, cache}
  let resultsById = sourceResult.reduce((ag, v) => {
    const key = v.getId().toString();
    // eslint-disable-next-line no-param-reassign
    ag[key] = { sourceResult: v, cacheResult: null };
    return ag;
  }, {} as ResultsById);
  resultsById = cacheResult.reduce((ag, v) => {
    const key = v.getId().toString();
    const s = ag[key]?.sourceResult ?? null;
    // eslint-disable-next-line no-param-reassign
    ag[key] = { sourceResult: s, cacheResult: v };
    return ag;
  }, resultsById);
  // 2. for all object.values() find at least one that source.date > cache.date
  const staleArticle = Object.values(resultsById).find(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    (v) => v.sourceResult!.getLastUpdated() > v.cacheResult!.getLastUpdated()
  );
  if (staleArticle !== undefined) return true;
  return false;
}

async function updateCacheAndRunCallbackIfStale(
  imageCache: ImageCache,
  cacheRepository: CachedArticleRepository,
  sourcePromise: Promise<Article[]>,
  cachePromise: Promise<Article[]>,
  onStaleCallback: Callback
) {
  const cacheResult = await cachePromise;
  let sourceResult: Article[] | null = null;
  try {
    sourceResult = await sourcePromise;
  } catch (e) {
    if (!(e instanceof ArticleNotFoundError)) throw e;
  }
  if (sourceResult === null) {
    await updateCache(imageCache, cacheRepository, [], cacheResult);
    onStaleCallback([new NullArticle()]);
    return;
  }
  if (!isStale(sourceResult, cacheResult)) return;
  onStaleCallback(sourceResult);
  await updateCache(imageCache, cacheRepository, sourceResult, cacheResult);
}

async function getAndAddCachedThumbnailForArticle(
  imageCache: ImageCache,
  article: Article
) {
  const thumbnail = article.getThumbnail();
  if (!thumbnail) return article;
  const thumbnailUri = thumbnail.getUri();
  if (!thumbnailUri.match(/^https?:\/\//)) return article;
  const image =
    await imageCache.getCachedImageAsFileUriOrSaveAndReturnSourceImage(
      thumbnail.getUri()
    );
  return article.clone({ thumbnail: image });
}

async function getAndAddCachedThumbnailForArticles(
  imageCache: ImageCache,
  cacheResult: Article[]
) {
  const promises = cacheResult.map((v) =>
    getAndAddCachedThumbnailForArticle(imageCache, v)
  );
  return Promise.all(promises);
}

async function getAndAddCachedImagesForArticle(
  imageCache: ImageCache,
  getImageSrcsInHtml: GetImageSrcsInHtml,
  replaceImageSrcsInHtml: ReplaceImageSrcsInHtml,
  article: Article
): Promise<Article> {
  const imageUrls = getImageSrcsInHtml(article.getHtml()).filter((v) =>
    v.match(/^https?:\/\//)
  );
  const promises = imageUrls.map((v) =>
    imageCache
      .getCachedImageAsBase64UrlOrSaveAndReturnSourceImage(v)
      .then((image) => [v, image.getUri()] as const)
  );
  const imagesUrlsAndCacheResults = await Promise.all(promises);
  const uriMap = Object.fromEntries(imagesUrlsAndCacheResults);
  const newHtml = replaceImageSrcsInHtml(uriMap, article.getHtml());
  return article.clone({ html: newHtml });
}

async function getAndAddCachedImagesForArticles(
  imageCache: ImageCache,
  getImageSrcsInHtml: GetImageSrcsInHtml,
  replaceImageSrcsInHtml: ReplaceImageSrcsInHtml,
  articles: Article[]
): Promise<Article[]> {
  const promises = articles.map((a) =>
    getAndAddCachedImagesForArticle(
      imageCache,
      getImageSrcsInHtml,
      replaceImageSrcsInHtml,
      a
    )
  );
  return Promise.all(promises);
}

async function sourceAvailableGetMultiple(
  imageCache: ImageCache,
  cacheRepository: CachedArticleRepository,
  getImageSrcsInHtml: GetImageSrcsInHtml,
  replaceImageSrcsInHtml: ReplaceImageSrcsInHtml,
  sourceGetter: Getter<Article[]>,
  cacheGetter: Getter<Article[]>,
  onStaleCallback: Callback
): Promise<Article[]> {
  const cachePromise = cacheGetter();
  const sourcePromise = retryUntilSuccess(sourceGetter);

  let cacheResultIsEmpty;
  try {
    const cacheResult = await cachePromise;
    cacheResultIsEmpty = cacheResult.length === 0;
  } catch (e) {
    if (e instanceof CachedArticleNotFoundError) cacheResultIsEmpty = true;
    // if getting from cache throws a different error, it should be handled below
  }

  if (cacheResultIsEmpty) {
    const sourceResult = await sourcePromise;
    updateCache(imageCache, cacheRepository, sourceResult, []);
    return sourceResult;
  }

  try {
    const cacheResult = await cachePromise;
    // Fire-and-forget background revalidation. If the source is unreachable it
    // rejects; we have already returned cached data, so swallow the error here
    // rather than letting it surface as an unhandled promise rejection.
    updateCacheAndRunCallbackIfStale(
      imageCache,
      cacheRepository,
      sourcePromise,
      cachePromise,
      onStaleCallback
    ).catch(() => {});
    const cachedResultWithThumbnails =
      await getAndAddCachedThumbnailForArticles(imageCache, cacheResult);
    return await getAndAddCachedImagesForArticles(
      imageCache,
      getImageSrcsInHtml,
      replaceImageSrcsInHtml,
      cachedResultWithThumbnails
    );
  } catch {
    return sourcePromise;
  }
}

async function sourceAvailableGetSingle(
  imageCache: ImageCache,
  cacheRepository: CachedArticleRepository,
  getImageSrcsInHtml: GetImageSrcsInHtml,
  replaceImageSrcsInHtml: ReplaceImageSrcsInHtml,
  sourceGetter: Getter<Article>,
  cacheGetter: Getter<Article>,
  onStaleCallback: SingleCallback
): Promise<Article> {
  const [result] = await sourceAvailableGetMultiple(
    imageCache,
    cacheRepository,
    getImageSrcsInHtml,
    replaceImageSrcsInHtml,
    () => sourceGetter().then((r) => [r]),
    () => cacheGetter().then((r) => [r]),
    ([r]) => onStaleCallback(r)
  );
  return result;
}

export { sourceAvailableGetMultiple, sourceAvailableGetSingle };
