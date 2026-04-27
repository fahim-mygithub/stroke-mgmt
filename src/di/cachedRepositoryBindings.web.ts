/**
 * Web cached-repository bindings.
 *
 * Web doesn't run `expo-sqlite` (the wa-sqlite worker requires
 * SharedArrayBuffer + COOP/COEP, which we don't host). Instead each cached
 * repo is an IndexedDB-native implementation registered under the same DI
 * keys the rest of the app (`ArticleCache`, `AlgorithmCache`, etc.) reads —
 * so consumers don't notice the swap.
 *
 * Metro picks this file over the sibling `cachedRepositoryBindings.ts` when
 * bundling for web by virtue of the `.web.ts` extension.
 */

import {
  IndexedDbCachedAlgorithmRepository,
  IndexedDbCachedArticleRepository,
  IndexedDbCachedImageMetadataRepository,
  IndexedDbCachedTagRepository,
  openIndexedDbDatabase,
} from '@/infrastructure/persistence/indexeddb';

export const cachedRepositoryBindings = {
  // The factory returns Promise<IDBDatabase | null>. Each repo `await`s it
  // internally and short-circuits to a no-op when null (private browsing,
  // quota, etc.) — same UX as the previous web build, just with offline
  // working when IDB is available.
  indexedDbDatabase: ['factory', openIndexedDbDatabase],
  cachedArticleRepository: ['type', IndexedDbCachedArticleRepository],
  cachedAlgorithmRepository: ['type', IndexedDbCachedAlgorithmRepository],
  cachedTagRepository: ['type', IndexedDbCachedTagRepository],
  cachedImageMetadataRepository: ['type', IndexedDbCachedImageMetadataRepository],
} as const;
