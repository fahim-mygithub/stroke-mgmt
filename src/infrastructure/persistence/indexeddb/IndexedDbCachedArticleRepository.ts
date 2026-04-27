import type {
  Article,
  ArticleId,
  BaseDesignation,
  CachedArticleRepository,
} from '@/domain/models/Article';
import { CachedArticleNotFoundError } from '@/domain/models/Article';
import {
  awaitRequest,
  awaitTransaction,
} from '@/infrastructure/persistence/indexeddb/helpers';
import { STORE_ARTICLES } from '@/infrastructure/persistence/indexeddb/openIndexedDbDatabase';
import { cachedArticleRowToArticle } from '@/infrastructure/persistence/websql/WebsqlCachedArticleRepository/cachedArticleRowToArticle';
import type { CachedArticleRow } from '@/infrastructure/persistence/websql/WebsqlCachedArticleRepository/tableSchema';

function articleToRow(a: Article): CachedArticleRow {
  return {
    id: a.getId().toString(),
    title: a.getTitle().toString(),
    html: a.getHtml(),
    summary: a.getSummaryOrNull(),
    designation: a.getDesignation().toString(),
    thumbnailUri: a.getThumbnail().getUri(),
    tagsJson: JSON.stringify(a.getTags()),
    citationsJson: JSON.stringify(a.getCitations()),
    lastUpdatedTimestamp: a.getLastUpdated().getTime(),
    shouldShowOnHomeScreen: a.getshouldShowOnHomeScreen() ? 1 : 0,
  };
}

class IndexedDbCachedArticleRepository implements CachedArticleRepository {
  ready: Promise<void>;

  constructor(
    private readonly indexedDbDatabase: Promise<IDBDatabase | null>
  ) {
    // `ready` exists for parity with the WebSQL repository (some specs /
    // callers reference it). Resolves once the open attempt has settled,
    // regardless of success — failure is surfaced as null inside each method.
    this.ready = indexedDbDatabase.then(() => undefined);
  }

  static $inject = ['indexedDbDatabase'];

  async isEmpty(): Promise<boolean> {
    const db = await this.indexedDbDatabase;
    if (!db) return true;
    const tx = db.transaction(STORE_ARTICLES, 'readonly');
    const count = await awaitRequest(tx.objectStore(STORE_ARTICLES).count());
    return count === 0;
  }

  async saveAll(articles: Article[]): Promise<void> {
    const db = await this.indexedDbDatabase;
    if (!db) return;
    const tx = db.transaction(STORE_ARTICLES, 'readwrite');
    const store = tx.objectStore(STORE_ARTICLES);
    articles.forEach((a) => store.put(articleToRow(a)));
    await awaitTransaction(tx);
  }

  async update(a: Article): Promise<void> {
    const db = await this.indexedDbDatabase;
    if (!db) return;
    const tx = db.transaction(STORE_ARTICLES, 'readwrite');
    tx.objectStore(STORE_ARTICLES).put(articleToRow(a));
    await awaitTransaction(tx);
  }

  async delete(id: ArticleId): Promise<void> {
    const db = await this.indexedDbDatabase;
    if (!db) return;
    const tx = db.transaction(STORE_ARTICLES, 'readwrite');
    tx.objectStore(STORE_ARTICLES).delete(id.toString());
    await awaitTransaction(tx);
  }

  async clearCache(): Promise<void> {
    const db = await this.indexedDbDatabase;
    if (!db) return;
    const tx = db.transaction(STORE_ARTICLES, 'readwrite');
    tx.objectStore(STORE_ARTICLES).clear();
    await awaitTransaction(tx);
  }

  async getByDesignation(d: BaseDesignation): Promise<Article[]> {
    const db = await this.indexedDbDatabase;
    if (!db) return [];
    const tx = db.transaction(STORE_ARTICLES, 'readonly');
    const index = tx.objectStore(STORE_ARTICLES).index('designation');
    const rows = await awaitRequest<CachedArticleRow[]>(
      index.getAll(IDBKeyRange.only(d.toString()))
    );
    return rows.map(cachedArticleRowToArticle);
  }

  async getById(id: ArticleId): Promise<Article> {
    const db = await this.indexedDbDatabase;
    if (!db) throw new CachedArticleNotFoundError(id);
    const tx = db.transaction(STORE_ARTICLES, 'readonly');
    const row = await awaitRequest<CachedArticleRow | undefined>(
      tx.objectStore(STORE_ARTICLES).get(id.toString())
    );
    if (!row) throw new CachedArticleNotFoundError(id);
    return cachedArticleRowToArticle(row);
  }

  async getAll(): Promise<Article[]> {
    const db = await this.indexedDbDatabase;
    if (!db) return [];
    const tx = db.transaction(STORE_ARTICLES, 'readonly');
    const rows = await awaitRequest<CachedArticleRow[]>(
      tx.objectStore(STORE_ARTICLES).getAll()
    );
    return rows.map(cachedArticleRowToArticle);
  }

  async isAvailable(): Promise<boolean> {
    const db = await this.indexedDbDatabase;
    return db !== null;
  }
}

export { IndexedDbCachedArticleRepository };
