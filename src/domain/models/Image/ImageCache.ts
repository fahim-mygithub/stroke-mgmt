import { Image } from '@/domain/models/Image/Image';
import { NullImage } from '@/domain/models/Image/NullImage';
import type { CachedImageMetadataRepository } from '@/domain/models/Image/ports/CachedImageMetadataRepository';
import type { ImageStore } from '@/domain/models/Image/ports/ImageStore';

class ImageCache {
  constructor(
    private readonly imageStore: ImageStore,
    private readonly cachedImageMetadataRepository: CachedImageMetadataRepository
  ) {}

  static $inject = ['imageStore', 'cachedImageMetadataRepository'];

  async saveImage(url: string) {
    // warning: may save repeats of same file with different names without deleting
    const metadata = await this.imageStore.saveFileFromUrl(url);
    return this.cachedImageMetadataRepository.save(metadata);
  }

  // added specifically because expo cached article repo needs to get base64 images.
  // if this dependency is entrenched deeper, it'd be useful to make a separate class for it.
  async getCachedImageAsBase64Url(url: string): Promise<Image> {
    const metadata = await this.cachedImageMetadataRepository.get(url);
    if (!metadata) return new NullImage();
    const fileExists = await this.imageStore.fileExists(metadata.getFilePath());
    if (!fileExists) return new NullImage();
    const dataUrl = await this.imageStore.getFileAsBase64Url(metadata);
    return new Image(dataUrl);
  }

  async getCachedImageAsBase64UrlOrSaveAndReturnSourceImage(
    url: string
  ): Promise<Image> {
    const result = await this.getCachedImageAsBase64Url(url);
    if (!(result instanceof NullImage)) return result;
    // Fire-and-forget cache write; swallow failures so they do not surface as
    // unhandled promise rejections. The source image is returned regardless.
    this.saveImage(url).catch(() => {});
    return new Image(url);
  }

  async getCachedImageAsFileUri(url: string): Promise<Image> {
    const metadata = await this.cachedImageMetadataRepository.get(url);
    if (!metadata) return new NullImage();
    const fileExists = await this.imageStore.fileExists(metadata.getFilePath());
    if (!fileExists) return new NullImage();
    const fileUri = metadata.getFilePath();
    return new Image(fileUri);
  }

  async getCachedImageAsFileUriOrSaveAndReturnSourceImage(
    url: string
  ): Promise<Image> {
    const result = await this.getCachedImageAsFileUri(url);
    if (!(result instanceof NullImage)) return result;
    // Fire-and-forget cache write; swallow failures so they do not surface as
    // unhandled promise rejections. The source image is returned regardless.
    this.saveImage(url).catch(() => {});
    return new Image(url);
  }

  async clearCache() {
    return Promise.all([
      this.imageStore.deleteAll(),
      this.cachedImageMetadataRepository.clearCache(),
    ]);
  }

  async saveImageIfNotExists(url: string): Promise<void> {
    // its possible that cached image has same name as new image and is stale
    // no update since metadata and file both exist
    // need a image metadata repo to get lastUpdated timestamp from source
    const metadata = await this.cachedImageMetadataRepository.get(url);
    if (!metadata) {
      return this.saveImage(url);
    }
    const fileExists = await this.imageStore.fileExists(metadata.getFilePath());
    if (!fileExists) {
      // when metadata already exists, repository should update existing record
      return this.saveImage(url);
    }
    return undefined;
  }
}

export { ImageCache };
