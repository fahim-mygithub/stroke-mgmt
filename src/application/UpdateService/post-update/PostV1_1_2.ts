import type { ClearCacheAction } from '@/application/ClearCacheAction';
import { Version } from '@/application/UpdateService/Version';
import type {
  PostUpdateChange,
  PostUpdateChangeClass,
} from '@/application/UpdateService/post-update/PostUpdateChange';

// 1.1.2 introduced sanitizeCmsHtml. Content cached by earlier builds was
// stored unsanitized and would bypass the sanitizer forever (cache refresh
// is gated on CMS updatedAt), so flush it once on first launch.
const PostV1_1_2: PostUpdateChangeClass = class implements PostUpdateChange {
  static version = new Version(1, 1, 2);

  constructor(private clearCacheAction: ClearCacheAction) {}

  static $inject: string[] = ['clearCacheAction'];

  async apply(): Promise<void> {
    await this.clearCacheAction.execute();
  }
};

export { PostV1_1_2 };
