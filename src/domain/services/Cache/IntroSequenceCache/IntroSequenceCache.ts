import type {
  CachedIntroSequenceRepository,
  IntroSequence,
  IntroSequenceRepository,
} from '@/domain/models/IntroSequence';
import { CachedIntroSequenceNotFoundError } from '@/domain/models/IntroSequence';
import { handleCacheStale } from '@/domain/services/Cache/IntroSequenceCache/handleCacheStale';
import { SourceUnavailableEmptyCacheResultError } from '@/domain/services/Cache/SourceUnavailableEmptyCacheResultError';
import { retryUntilSuccess } from '@/domain/services/Cache/retryUntilSuccess';

class IntroSequenceCache {
  constructor(
    private readonly introSequenceRepository: IntroSequenceRepository,
    private readonly cachedIntroSequenceRepository: CachedIntroSequenceRepository
  ) {}

  static $inject = ['introSequenceRepository', 'cachedIntroSequenceRepository'];

  async get(onStale: (v: IntroSequence) => void): Promise<IntroSequence> {
    const sourceAvailable = await this.introSequenceRepository.isAvailable();
    if (!sourceAvailable) return this.sourceUnavailableGet();
    return this.sourceAvailableGet(onStale);
  }

  private async sourceUnavailableGet(): Promise<IntroSequence> {
    if (await this.cachedIntroSequenceRepository.isEmpty()) {
      throw new SourceUnavailableEmptyCacheResultError();
    }
    try {
      return await this.cachedIntroSequenceRepository.get();
    } catch (e) {
      if (e instanceof CachedIntroSequenceNotFoundError) {
        throw new SourceUnavailableEmptyCacheResultError();
      }
      throw e;
    }
  }

  private async sourceAvailableGet(
    onStale: (v: IntroSequence) => void
  ): Promise<IntroSequence> {
    const getFromSource = () =>
      retryUntilSuccess(() => this.introSequenceRepository.get());

    if (await this.cachedIntroSequenceRepository.isEmpty()) {
      const sourceResult = await getFromSource();
      this.cachedIntroSequenceRepository.save(sourceResult);
      return sourceResult;
    }

    try {
      const cacheResult = await this.cachedIntroSequenceRepository.get();
      // Fire-and-forget background revalidation. If the source is unreachable
      // it rejects; we have already returned cached data, so swallow the error
      // rather than letting it surface as an unhandled promise rejection.
      handleCacheStale(
        this.cachedIntroSequenceRepository,
        getFromSource,
        cacheResult,
        onStale
      ).catch(() => {});
      return cacheResult;
    } catch (e) {
      return getFromSource();
    }
  }

  async clearCache() {
    return this.cachedIntroSequenceRepository.clearCache();
  }
}

export { IntroSequenceCache };
