import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import {
  Article,
  ArticleId,
  CachedArticleNotFoundError,
  Designation,
} from '@/domain/models/Article';
import { Image } from '@/domain/models/Image';
import { IndexedDbCachedArticleRepository } from '@/infrastructure/persistence/indexeddb/IndexedDbCachedArticleRepository';
import { openIndexedDbDatabase } from '@/infrastructure/persistence/indexeddb/openIndexedDbDatabase';

describe('IndexedDbCachedArticleRepository', () => {
  const articleZero = new Article({
    id: new ArticleId('0'),
    title: 'My Title 0',
    html: '<h1>Hello World 0</h1>',
    designation: Designation.ARTICLE,
    thumbnail: new Image('https://foo.io/bar.png'),
    tags: [],
    citations: [],
    lastUpdated: new Date(0),
    shouldShowOnHomeScreen: true,
  });
  const articleOne = new Article({
    id: new ArticleId('1'),
    title: 'My Title 1',
    html: '<h1>Hello World 1</h1>',
    designation: Designation.ARTICLE,
    thumbnail: new Image('https://foo.io/baz.png'),
    tags: [],
    citations: [],
    lastUpdated: new Date(0),
    shouldShowOnHomeScreen: true,
  });
  const articleTwo = new Article({
    id: new ArticleId('2'),
    title: 'My Title 2',
    html: '<h1>Hello World 2</h1>',
    designation: Designation.ARTICLE,
    thumbnail: new Image('https://foo.io/bar.png'),
    tags: [],
    citations: [],
    lastUpdated: new Date(0),
    shouldShowOnHomeScreen: true,
  });
  const disclaimer = new Article({
    id: new ArticleId('3'),
    title: 'My Disclaimer',
    html: '<h1>My Disclaimer</h1>',
    designation: Designation.DISCLAIMER,
    thumbnail: new Image('https://foo.io/disc.png'),
    tags: [],
    citations: [],
    lastUpdated: new Date(0),
    shouldShowOnHomeScreen: true,
  });

  beforeEach(() => {
    // Reset fake IDB between tests so each spec sees a clean DB.
    (globalThis as unknown as { indexedDB: unknown }).indexedDB =
      new IDBFactory();
  });

  describe('Instantiation', () => {
    it('should be created with an indexeddb database promise', () => {
      const create = () =>
        new IndexedDbCachedArticleRepository(openIndexedDbDatabase());
      expect(create).not.toThrow();
    });

    it('should be ready after open settles', async () => {
      const repo = new IndexedDbCachedArticleRepository(openIndexedDbDatabase());
      await expect(repo.ready).resolves.toBeUndefined();
    });
  });

  describe('isEmpty', () => {
    it('should be empty on instantiation', async () => {
      const repo = new IndexedDbCachedArticleRepository(openIndexedDbDatabase());
      expect(await repo.isEmpty()).toBe(true);
    });

    it('should not be empty after saving an article', async () => {
      const repo = new IndexedDbCachedArticleRepository(openIndexedDbDatabase());
      await repo.saveAll([articleZero]);
      expect(await repo.isEmpty()).toBe(false);
    });
  });

  describe('saveAll', () => {
    it('should save one article', async () => {
      const repo = new IndexedDbCachedArticleRepository(openIndexedDbDatabase());
      await repo.saveAll([articleZero]);
      const all = await repo.getAll();
      expect(all).toHaveLength(1);
      expect(all[0].getId().toString()).toBe('0');
    });

    it('should save many articles', async () => {
      const repo = new IndexedDbCachedArticleRepository(openIndexedDbDatabase());
      await repo.saveAll([articleZero, articleOne, articleTwo]);
      const all = await repo.getAll();
      expect(all).toHaveLength(3);
      const ids = all.map((a) => a.getId().toString()).sort();
      expect(ids).toEqual(['0', '1', '2']);
    });
  });

  describe('update', () => {
    it('should overwrite an existing article', async () => {
      const repo = new IndexedDbCachedArticleRepository(openIndexedDbDatabase());
      await repo.saveAll([articleZero]);
      const updated = articleZero.clone({ title: 'Updated Title' });
      await repo.update(updated);
      const fetched = await repo.getById(new ArticleId('0'));
      expect(fetched.getTitle()).toBe('Updated Title');
    });
  });

  describe('delete', () => {
    it('should delete a single article by id', async () => {
      const repo = new IndexedDbCachedArticleRepository(openIndexedDbDatabase());
      await repo.saveAll([articleZero, articleOne]);
      await repo.delete(new ArticleId('0'));
      await expect(repo.getById(new ArticleId('0'))).rejects.toBeInstanceOf(
        CachedArticleNotFoundError
      );
      const remaining = await repo.getAll();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].getId().toString()).toBe('1');
    });
  });

  describe('clearCache', () => {
    it('should remove all articles', async () => {
      const repo = new IndexedDbCachedArticleRepository(openIndexedDbDatabase());
      await repo.saveAll([articleZero, articleOne, articleTwo]);
      await repo.clearCache();
      const all = await repo.getAll();
      expect(all).toHaveLength(0);
      expect(await repo.isEmpty()).toBe(true);
    });
  });

  describe('getByDesignation', () => {
    it('should get only articles matching the designation', async () => {
      const repo = new IndexedDbCachedArticleRepository(openIndexedDbDatabase());
      await repo.saveAll([articleZero, articleOne, articleTwo, disclaimer]);
      const articles = await repo.getByDesignation(Designation.ARTICLE);
      expect(articles).toHaveLength(3);
    });

    it('should get the disclaimer', async () => {
      const repo = new IndexedDbCachedArticleRepository(openIndexedDbDatabase());
      await repo.saveAll([articleZero, articleOne, articleTwo, disclaimer]);
      const articles = await repo.getByDesignation(Designation.DISCLAIMER);
      expect(articles).toHaveLength(1);
      expect(articles[0].is(disclaimer)).toBe(true);
    });
  });

  describe('getById', () => {
    it('should get an article by id', async () => {
      const repo = new IndexedDbCachedArticleRepository(openIndexedDbDatabase());
      await repo.saveAll([articleZero, articleOne, articleTwo, disclaimer]);
      const article = await repo.getById(new ArticleId('0'));
      expect(article.is(articleZero)).toBe(true);
    });

    it('should throw CachedArticleNotFoundError when missing', async () => {
      const repo = new IndexedDbCachedArticleRepository(openIndexedDbDatabase());
      await repo.saveAll([articleZero]);
      await expect(repo.getById(new ArticleId('1000'))).rejects.toBeInstanceOf(
        CachedArticleNotFoundError
      );
    });
  });

  describe('getAll', () => {
    it('should get all articles', async () => {
      const repo = new IndexedDbCachedArticleRepository(openIndexedDbDatabase());
      await repo.saveAll([articleZero, articleOne, articleTwo, disclaimer]);
      const all = await repo.getAll();
      expect(all).toHaveLength(4);
    });
  });

  describe('isAvailable', () => {
    it('should be available when IDB opens', async () => {
      const repo = new IndexedDbCachedArticleRepository(openIndexedDbDatabase());
      expect(await repo.isAvailable()).toBe(true);
    });
  });

  describe('failure path: indexedDB unavailable', () => {
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      (globalThis as unknown as { indexedDB: unknown }).indexedDB = undefined;
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('should no-op writes and return safe defaults on reads', async () => {
      const repo = new IndexedDbCachedArticleRepository(openIndexedDbDatabase());
      await expect(repo.saveAll([articleZero])).resolves.toBeUndefined();
      await expect(repo.update(articleZero)).resolves.toBeUndefined();
      await expect(repo.delete(new ArticleId('0'))).resolves.toBeUndefined();
      await expect(repo.clearCache()).resolves.toBeUndefined();
      expect(await repo.isEmpty()).toBe(true);
      expect(await repo.getAll()).toEqual([]);
      expect(
        await repo.getByDesignation(Designation.ARTICLE)
      ).toEqual([]);
      expect(await repo.isAvailable()).toBe(false);
      await expect(repo.getById(new ArticleId('0'))).rejects.toBeInstanceOf(
        CachedArticleNotFoundError
      );
    });
  });
});
