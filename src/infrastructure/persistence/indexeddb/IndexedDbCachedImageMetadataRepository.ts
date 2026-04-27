import type { CachedImageMetadataRepository } from '@/domain/models/Image';
import { CachedImageMetadata } from '@/domain/models/Image';
import {
  awaitRequest,
  awaitTransaction,
} from '@/infrastructure/persistence/indexeddb/helpers';
import { STORE_IMAGE_METADATA } from '@/infrastructure/persistence/indexeddb/openIndexedDbDatabase';

type CachedImageMetadataRecord = {
  sourceUrl: string;
  filePath: string;
  mimeType: string;
};

function metadataToRecord(m: CachedImageMetadata): CachedImageMetadataRecord {
  return {
    sourceUrl: m.getSourceUrl(),
    filePath: m.getFilePath(),
    mimeType: m.getMimeType(),
  };
}

class IndexedDbCachedImageMetadataRepository
  implements CachedImageMetadataRepository
{
  ready: Promise<void>;

  constructor(
    private readonly indexedDbDatabase: Promise<IDBDatabase | null>
  ) {
    this.ready = indexedDbDatabase.then(() => undefined);
  }

  static $inject = ['indexedDbDatabase'];

  async get(url: string): Promise<CachedImageMetadata | null> {
    const db = await this.indexedDbDatabase;
    if (!db) return null;
    const tx = db.transaction(STORE_IMAGE_METADATA, 'readonly');
    const record = await awaitRequest<CachedImageMetadataRecord | undefined>(
      tx.objectStore(STORE_IMAGE_METADATA).get(url)
    );
    if (!record) return null;
    return new CachedImageMetadata(
      record.sourceUrl,
      record.filePath,
      record.mimeType
    );
  }

  async save(metadata: CachedImageMetadata): Promise<void> {
    const db = await this.indexedDbDatabase;
    if (!db) return;
    // `put` is an upsert keyed on sourceUrl — replaces an existing record if
    // present, inserts otherwise. The WebSQL repo achieves this by an
    // exists+update / insert branch; IDB collapses to one call.
    const tx = db.transaction(STORE_IMAGE_METADATA, 'readwrite');
    tx.objectStore(STORE_IMAGE_METADATA).put(metadataToRecord(metadata));
    await awaitTransaction(tx);
  }

  async clearCache(): Promise<void> {
    const db = await this.indexedDbDatabase;
    if (!db) return;
    const tx = db.transaction(STORE_IMAGE_METADATA, 'readwrite');
    tx.objectStore(STORE_IMAGE_METADATA).clear();
    await awaitTransaction(tx);
  }
}

export { IndexedDbCachedImageMetadataRepository };
