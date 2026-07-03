import type {
  CachedAlgorithmRepository,
  Algorithm,
} from '@/domain/models/Algorithm';
import {
  AlgorithmNotFoundError,
  NullAlgorithm,
  CachedAlgorithmNotFoundError,
} from '@/domain/models/Algorithm';
import type { ImageCache } from '@/domain/models/Image';
import { updateCache } from '@/domain/services/Cache/AlgorithmCache/updateCache';
import type { GetImageSrcsInHtml } from '@/domain/services/Cache/GetImageSrcsInHtml';
import type { ReplaceImageSrcsInHtml } from '@/domain/services/Cache/ReplaceImageSrcsInHtml';
import { retryUntilSuccess } from '@/domain/services/Cache/retryUntilSuccess';
import type { Getter } from '@/domain/services/Cache/Getter';
import { getAndAddCachedImagesForAlgorithms } from '@/domain/services/Cache/AlgorithmCache/getAndAddCachedImagesForAlgorithms';

type SingleCallback = (res: Algorithm) => void;
type Callback = (res: Algorithm[]) => void;

function isStale(sourceResult: Algorithm[], cacheResult: Algorithm[]): boolean {
  // check to make sure the number of results are the same
  if (sourceResult.length !== cacheResult.length) return true;

  // look for deleted or newly created algorithms
  const sourceAlgorithmIds = new Set(
    sourceResult.map((r) => r.getId().toString())
  );
  const cacheAlgorithmIds = new Set(
    cacheResult.map((r) => r.getId().toString())
  );
  const inSourceNotCache = [...sourceAlgorithmIds.values()].find(
    (id) => !cacheAlgorithmIds.has(id)
  );
  const inCacheNotSource = [...cacheAlgorithmIds.values()].find(
    (id) => !sourceAlgorithmIds.has(id)
  );
  if (inSourceNotCache !== undefined || inCacheNotSource !== undefined)
    return true;

  // look for cached algorithms that are older than lastUpdated date.
  type ResultsById = {
    [key: string]: {
      sourceResult: Algorithm | null;
      cacheResult: Algorithm | null;
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
  const staleAlgorithm = Object.values(resultsById).find(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    (v) => v.sourceResult!.getLastUpdated() > v.cacheResult!.getLastUpdated()
  );
  if (staleAlgorithm !== undefined) return true;
  return false;
}

async function updateCacheAndRunCallbackIfStale(
  imageCache: ImageCache,
  cacheRepository: CachedAlgorithmRepository,
  sourcePromise: Promise<Algorithm[]>,
  cachePromise: Promise<Algorithm[]>,
  onStaleCallback: Callback
) {
  const cacheResult = await cachePromise;
  let sourceResult: Algorithm[] | null = null;
  try {
    sourceResult = await sourcePromise;
  } catch (e) {
    if (!(e instanceof AlgorithmNotFoundError)) throw e;
  }
  if (sourceResult === null) {
    await updateCache(imageCache, cacheRepository, [], cacheResult);
    onStaleCallback([new NullAlgorithm()]);
    return;
  }
  if (!isStale(sourceResult, cacheResult)) return;
  onStaleCallback(sourceResult);
  await updateCache(imageCache, cacheRepository, sourceResult, cacheResult);
}

async function getAndAddCachedThumbnailForAlgorithm(
  imageCache: ImageCache,
  algorithm: Algorithm
) {
  const thumbnail = algorithm.getThumbnail();
  if (!thumbnail) return algorithm;
  const thumbnailUri = thumbnail.getUri();
  if (!thumbnailUri.match(/^https?:\/\//)) return algorithm;
  const image =
    await imageCache.getCachedImageAsFileUriOrSaveAndReturnSourceImage(
      thumbnail.getUri()
    );
  return algorithm.setMetadata({ thumbnail: image });
}

async function getAndAddCachedThumbnailForAlgorithms(
  imageCache: ImageCache,
  cacheResult: Algorithm[]
) {
  const promises = cacheResult.map((v) =>
    getAndAddCachedThumbnailForAlgorithm(imageCache, v)
  );
  return Promise.all(promises);
}

async function sourceAvailableGetMultiple(
  imageCache: ImageCache,
  cacheRepository: CachedAlgorithmRepository,
  getImageSrcsInHtml: GetImageSrcsInHtml,
  replaceImageSrcsInHtml: ReplaceImageSrcsInHtml,
  sourceGetter: Getter<Algorithm[]>,
  cacheGetter: Getter<Algorithm[]>,
  onStaleCallback: Callback
): Promise<Algorithm[]> {
  const cachePromise = cacheGetter();
  const sourcePromise = retryUntilSuccess(sourceGetter);

  let cacheResultIsEmpty;
  try {
    const cacheResult = await cachePromise;
    cacheResultIsEmpty = cacheResult.length === 0;
  } catch (e) {
    if (e instanceof CachedAlgorithmNotFoundError) cacheResultIsEmpty = true;
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
      await getAndAddCachedThumbnailForAlgorithms(imageCache, cacheResult);
    return await getAndAddCachedImagesForAlgorithms(
      (url) =>
        imageCache.getCachedImageAsBase64UrlOrSaveAndReturnSourceImage(url),
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
  cacheRepository: CachedAlgorithmRepository,
  getImageSrcsInHtml: GetImageSrcsInHtml,
  replaceImageSrcsInHtml: ReplaceImageSrcsInHtml,
  sourceGetter: Getter<Algorithm>,
  cacheGetter: Getter<Algorithm>,
  onStaleCallback: SingleCallback
): Promise<Algorithm> {
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
