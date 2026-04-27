/**
 * Native (iOS / Android) cached-repository bindings.
 *
 * The four `Websql*Repository` classes wrap an `expo-sqlite`-backed
 * `Database` shim. Web overrides this via `cachedRepositoryBindings.web.ts`
 * to use IndexedDB-native repositories instead — picked up automatically by
 * Metro's `.web.ts` resolution.
 */

import { openExpoSqliteDatabase } from '@/infrastructure/persistence/websql/expo-sqlite';
import { WebsqlCachedAlgorithmRepostiory } from '@/infrastructure/persistence/websql/WebsqlCachedAlgorithmRepository/WebsqlCachedAlgorithmRepository';
import { WebsqlCachedArticleRepository } from '@/infrastructure/persistence/websql/WebsqlCachedArticleRepository';
import { WebsqlCachedImageMetadataRepository } from '@/infrastructure/persistence/websql/WebsqlCachedImageMetadataRepository';
import { WebsqlCachedTagRepository } from '@/infrastructure/persistence/websql/WebsqlCachedTagRepository';

export const cachedRepositoryBindings = {
  websqlDatabase: ['factory', openExpoSqliteDatabase],
  cachedArticleRepository: ['type', WebsqlCachedArticleRepository],
  cachedAlgorithmRepository: ['type', WebsqlCachedAlgorithmRepostiory],
  cachedTagRepository: ['type', WebsqlCachedTagRepository],
  cachedImageMetadataRepository: ['type', WebsqlCachedImageMetadataRepository],
} as const;
