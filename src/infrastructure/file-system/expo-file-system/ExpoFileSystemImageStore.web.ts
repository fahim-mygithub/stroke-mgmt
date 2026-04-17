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

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

class ExpoFileSystemImageStore implements ImageStore {
  private readonly store = new Map<string, string>();

  async getFileAsBase64Url(metadata: CachedImageMetadata): Promise<string> {
    const base64 = this.store.get(metadata.getFilePath());
    if (!base64) {
      throw new Error(`No cached image at ${metadata.getFilePath()}`);
    }
    return `data:${metadata.getMimeType()};base64,${base64}`;
  }

  async saveFileFromUrl(url: string): Promise<CachedImageMetadata> {
    const ext = url.match(/\.[a-zA-Z]+$/)?.[0] ?? '';
    const response = await fetch(url);
    const blob = await response.blob();
    const base64 = await blobToBase64(blob);
    const key = `images-v2/${uuidv4()}${ext}`;
    this.store.set(key, base64);
    return new CachedImageMetadata(url, key, extToMimeType(ext));
  }

  async fileExists(path: string): Promise<boolean> {
    return this.store.has(path);
  }

  async deleteAll(): Promise<void> {
    this.store.clear();
  }
}

export { ExpoFileSystemImageStore };
