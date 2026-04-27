import type { CachedTagRepository } from '@/domain/models/Tag';
import { Tag } from '@/domain/models/Tag';
import {
  awaitRequest,
  awaitTransaction,
} from '@/infrastructure/persistence/indexeddb/helpers';
import { STORE_TAGS } from '@/infrastructure/persistence/indexeddb/openIndexedDbDatabase';

type CachedTagRecord = {
  name: string;
  lastUpdatedTimestamp: number;
  description: string;
};

function tagToRecord(t: Tag): CachedTagRecord {
  return {
    name: t.getName(),
    lastUpdatedTimestamp: t.getLastUpdated().getTime(),
    description: t.getDescription(),
  };
}

function recordToTag(r: CachedTagRecord): Tag {
  return new Tag(r.name, new Date(r.lastUpdatedTimestamp), r.description);
}

class IndexedDbCachedTagRepository implements CachedTagRepository {
  ready: Promise<void>;

  constructor(
    private readonly indexedDbDatabase: Promise<IDBDatabase | null>
  ) {
    this.ready = indexedDbDatabase.then(() => undefined);
  }

  static $inject = ['indexedDbDatabase'];

  async saveAll(tags: Tag[]): Promise<void> {
    const db = await this.indexedDbDatabase;
    if (!db) return;
    const tx = db.transaction(STORE_TAGS, 'readwrite');
    const store = tx.objectStore(STORE_TAGS);
    tags.forEach((t) => store.put(tagToRecord(t)));
    await awaitTransaction(tx);
  }

  async update(tag: Tag): Promise<void> {
    const db = await this.indexedDbDatabase;
    if (!db) return;
    const tx = db.transaction(STORE_TAGS, 'readwrite');
    tx.objectStore(STORE_TAGS).put(tagToRecord(tag));
    await awaitTransaction(tx);
  }

  async delete(tagName: string): Promise<void> {
    const db = await this.indexedDbDatabase;
    if (!db) return;
    const tx = db.transaction(STORE_TAGS, 'readwrite');
    tx.objectStore(STORE_TAGS).delete(tagName);
    await awaitTransaction(tx);
  }

  async clearCache(): Promise<void> {
    const db = await this.indexedDbDatabase;
    if (!db) return;
    const tx = db.transaction(STORE_TAGS, 'readwrite');
    tx.objectStore(STORE_TAGS).clear();
    await awaitTransaction(tx);
  }

  async getAll(): Promise<Tag[]> {
    const db = await this.indexedDbDatabase;
    if (!db) return [];
    const tx = db.transaction(STORE_TAGS, 'readonly');
    const records = await awaitRequest<CachedTagRecord[]>(
      tx.objectStore(STORE_TAGS).getAll()
    );
    return records.map(recordToTag);
  }

  async isAvailable(): Promise<boolean> {
    const db = await this.indexedDbDatabase;
    return db !== null;
  }
}

export { IndexedDbCachedTagRepository };
