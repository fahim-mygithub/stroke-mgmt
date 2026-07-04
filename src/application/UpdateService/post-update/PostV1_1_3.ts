import type { ClearCacheAction } from '@/application/ClearCacheAction';
import { Version } from '@/application/UpdateService/Version';
import type {
  PostUpdateChange,
  PostUpdateChangeClass,
} from '@/application/UpdateService/post-update/PostUpdateChange';

// 1.1.3 switched card images from Strapi's `thumbnail` format (~104–245px)
// to `large` (~1000px). Cached rows pin the URL chosen at fetch time and
// cache refresh is gated on CMS updatedAt, so existing installs would keep
// the low-res URLs forever — flush once so the new format selection applies.
const PostV1_1_3: PostUpdateChangeClass = class implements PostUpdateChange {
  static version = new Version(1, 1, 3);

  constructor(private clearCacheAction: ClearCacheAction) {}

  static $inject: string[] = ['clearCacheAction'];

  async apply(): Promise<void> {
    await this.clearCacheAction.execute();
  }
};

export { PostV1_1_3 };
