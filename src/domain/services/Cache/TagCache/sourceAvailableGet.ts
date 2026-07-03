import type { Tag } from '@/domain/models/Tag';
import type { CachedTagRepository } from '@/domain/models/Tag/ports/CachedTagRepository';
import type { Getter } from '@/domain/services/Cache/Getter';
import { updateCache } from '@/domain/services/Cache/TagCache/updateCache';
import { retryUntilSuccess } from '@/domain/services/Cache/retryUntilSuccess';

function isStale(sourceResult: Tag[], cacheResult: Tag[]): boolean {
  // check to make sure the number of results are the same
  if (sourceResult.length !== cacheResult.length) return true;

  // look for deleted or newly created tags
  const sourceTagNames = new Set(sourceResult.map((r) => r.getName()));
  const cacheTagNames = new Set(cacheResult.map((r) => r.getName()));
  const inSourceNotCache = [...sourceTagNames.values()].find(
    (id) => !cacheTagNames.has(id)
  );
  const inCacheNotSource = [...cacheTagNames.values()].find(
    (id) => !sourceTagNames.has(id)
  );
  if (inSourceNotCache !== undefined || inCacheNotSource !== undefined)
    return true;

  // look for cached tags that are older than lastUpdated date.
  type ResultsById = {
    [key: string]: {
      sourceResult: Tag | null;
      cacheResult: Tag | null;
    };
  };
  // 1. group by id into an object keyed by id, values are {source, cache}
  let resultsById = sourceResult.reduce((ag, v) => {
    const key = v.getName();
    // eslint-disable-next-line no-param-reassign
    ag[key] = { sourceResult: v, cacheResult: null };
    return ag;
  }, {} as ResultsById);
  resultsById = cacheResult.reduce((ag, v) => {
    const key = v.getName();
    const s = ag[key]?.sourceResult ?? null;
    // eslint-disable-next-line no-param-reassign
    ag[key] = { sourceResult: s, cacheResult: v };
    return ag;
  }, resultsById);
  // 2. for all object.values() find at least one that source.date > cache.date
  const staleTag = Object.values(resultsById).find(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    (v) => v.sourceResult!.getLastUpdated() > v.cacheResult!.getLastUpdated()
  );
  if (staleTag !== undefined) return true;
  return false;
}

async function updateCacheAndRunCallbackIfStale(
  cacheRepository: CachedTagRepository,
  sourcePromise: Promise<Tag[]>,
  cacheResult: Tag[],
  onStaleCallback: (v: Tag[]) => void
) {
  const sourceResult = await sourcePromise;
  if (!isStale(sourceResult, cacheResult)) return;
  onStaleCallback(sourceResult);
  updateCache(cacheRepository, sourceResult, cacheResult);
}

async function sourceAvailableGet(
  cacheRepository: CachedTagRepository,
  sourceGetter: Getter<Tag[]>,
  cacheGetter: Getter<Tag[]>,
  onStaleCallback: (v: Tag[]) => void
) {
  const cachePromise = cacheGetter();
  const sourcePromise = retryUntilSuccess(sourceGetter, 3);
  try {
    const cacheResult = await cachePromise;
    const cacheResultIsEmpty = cacheResult.length === 0;
    if (cacheResultIsEmpty) {
      const sourceResult = await sourcePromise;
      updateCache(cacheRepository, sourceResult, cacheResult);
      return sourceResult;
    }
    // Fire-and-forget background revalidation. If the source is unreachable it
    // rejects; we have already returned cached data, so swallow the error here
    // rather than letting it surface as an unhandled promise rejection.
    updateCacheAndRunCallbackIfStale(
      cacheRepository,
      sourcePromise,
      cacheResult,
      onStaleCallback
    ).catch(() => {});
    return cacheResult;
  } catch {
    return sourcePromise;
  }
}

export { sourceAvailableGet };
