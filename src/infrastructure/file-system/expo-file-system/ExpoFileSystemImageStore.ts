import { Directory, File, Paths } from 'expo-file-system';
import { v4 as uuidv4 } from 'uuid';

import type { ImageStore } from '@/domain/models/Image';
import { CachedImageMetadata } from '@/domain/models/Image';

const MIME_TYPES = {
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  GIF: 'image/gif',
  WEBP: 'image/webp',
  SVG: 'image/svg+xml',
  UNKNOWN: 'application/octet-stream',
};

function extToMimeType(ext: string) {
  switch (ext.toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return MIME_TYPES.JPEG;
    case '.png':
      return MIME_TYPES.PNG;
    case '.gif':
      return MIME_TYPES.GIF;
    case '.webp':
      return MIME_TYPES.WEBP;
    case '.svg':
      return MIME_TYPES.SVG;
    default:
      return MIME_TYPES.UNKNOWN;
  }
}

class ExpoFileSystemImageStore implements ImageStore {
  imagesDir: Directory;

  constructor() {
    this.imagesDir = new Directory(Paths.cache, 'images-v2');
    this.prepareCacheDirectory();
  }

  private prepareCacheDirectory() {
    if (!this.imagesDir.exists) this.imagesDir.create();
  }

  async getFileAsBase64Url(metadata: CachedImageMetadata): Promise<string> {
    const file = new File(metadata.getFilePath());
    const base64String = await file.base64();
    return `data:${metadata.getMimeType()};base64,${base64String}`;
  }

  async saveFileFromUrl(url: string): Promise<CachedImageMetadata> {
    const ext = url.match(/\.[a-zA-Z]+$/)?.[0] ?? '';
    const destFile = new File(this.imagesDir, `${uuidv4()}${ext}`);
    const file = await File.downloadFileAsync(url, destFile);
    return new CachedImageMetadata(url, file.uri, extToMimeType(ext));
  }

  async fileExists(path: string): Promise<boolean> {
    const file = new File(path);
    return file.exists;
  }

  async deleteAll(): Promise<void> {
    this.imagesDir.delete();
    this.imagesDir.create();
  }
}

export { ExpoFileSystemImageStore };
