import type { Version } from '@/application/UpdateService/Version';
import type { VersionRepository } from '@/application/UpdateService/VersionRepository';
import type {
  PostUpdateChange,
  PostUpdateChangeClass,
} from '@/application/UpdateService/post-update';
import type { Injector } from 'didi';

class UpdateService {
  constructor(
    private readonly postUpdateChanges: PostUpdateChangeClass[],
    private readonly currentVersion: Version,
    private readonly versionRepository: VersionRepository,
    private readonly injector: Injector
  ) {}

  static $inject = [
    'postUpdateChanges',
    'currentVersion',
    'versionRepository',
    'injector',
  ];

  async performPostUpdateChangesIfNecessary(): Promise<void> {
    if (await this.shouldPerformPostUpdateChanges()) {
      await this.performNecessaryPostUpdateChanges();
      return;
    }
    // Persist even when nothing ran. A fresh install's first launch reports
    // currentVersion via the empty-storage heuristic without writing it; by
    // the second launch other keys exist, so a missing version key would be
    // misread as a v1.0.0 upgrade and re-run every post-update change.
    await this.versionRepository.update(this.currentVersion);
  }

  private async shouldPerformPostUpdateChanges() {
    const versionDuringPreviousRun =
      await this.versionRepository.getLastUsedVersion();
    return versionDuringPreviousRun.isLessThan(this.currentVersion);
  }

  private async performNecessaryPostUpdateChanges() {
    const versionDuringPreviousRun =
      await this.versionRepository.getLastUsedVersion();

    // eslint-disable-next-line no-restricted-syntax
    for (const postUpdateClass of this.postUpdateChanges) {
      if (versionDuringPreviousRun.isLessThan(postUpdateClass.version)) {
        // eslint-disable-next-line no-await-in-loop
        await this.applyPostUpdateChange(postUpdateClass);
      }
    }

    await this.versionRepository.update(this.currentVersion);
  }

  private async applyPostUpdateChange(
    postUpdateChangeClass: PostUpdateChangeClass
  ) {
    const change = this.injector.instantiate<PostUpdateChange>(
      postUpdateChangeClass as never
    );
    await change.apply();
  }
}

export { UpdateService };
