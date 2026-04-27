import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { Tag } from '@/domain/models/Tag';
import { IndexedDbCachedTagRepository } from '@/infrastructure/persistence/indexeddb/IndexedDbCachedTagRepository';
import { openIndexedDbDatabase } from '@/infrastructure/persistence/indexeddb/openIndexedDbDatabase';

describe('IndexedDbCachedTagRepository', () => {
  beforeEach(() => {
    (globalThis as unknown as { indexedDB: unknown }).indexedDB =
      new IDBFactory();
  });

  describe('Instantiation', () => {
    it('should be created with an indexeddb database promise', () => {
      const create = () =>
        new IndexedDbCachedTagRepository(openIndexedDbDatabase());
      expect(create).not.toThrow();
    });
  });

  describe('saveAll', () => {
    it('should save all tags', async () => {
      const repo = new IndexedDbCachedTagRepository(openIndexedDbDatabase());
      await repo.saveAll([
        new Tag('Tag0', new Date(0), 'desc 0'),
        new Tag('Tag1', new Date(0), 'desc 1'),
      ]);
      const tags = await repo.getAll();
      expect(tags).toHaveLength(2);
      const names = tags.map((t) => t.getName()).sort();
      expect(names).toEqual(['Tag0', 'Tag1']);
    });
  });

  describe('update', () => {
    it('should overwrite an existing tag of the same name', async () => {
      const repo = new IndexedDbCachedTagRepository(openIndexedDbDatabase());
      await repo.saveAll([new Tag('MyTag', new Date(0), 'old description')]);
      await repo.update(new Tag('MyTag', new Date(10), 'new description'));
      const tags = await repo.getAll();
      expect(tags).toHaveLength(1);
      expect(tags[0].getDescription()).toBe('new description');
      expect(tags[0].getLastUpdated().getTime()).toBe(10);
    });
  });

  describe('delete', () => {
    it('should delete a tag by name', async () => {
      const repo = new IndexedDbCachedTagRepository(openIndexedDbDatabase());
      await repo.saveAll([
        new Tag('MyTag0', new Date(0), 'd0'),
        new Tag('MyTag1', new Date(0), 'd1'),
      ]);
      await repo.delete('MyTag0');
      const tags = await repo.getAll();
      expect(tags).toHaveLength(1);
      expect(tags[0].getName()).toBe('MyTag1');
    });
  });

  describe('clearCache', () => {
    it('should remove all tags', async () => {
      const repo = new IndexedDbCachedTagRepository(openIndexedDbDatabase());
      await repo.saveAll([
        new Tag('MyTag0', new Date(0), 'd0'),
        new Tag('MyTag1', new Date(0), 'd1'),
      ]);
      await repo.clearCache();
      expect(await repo.getAll()).toHaveLength(0);
    });
  });

  describe('getAll', () => {
    it('should round-trip tag fields', async () => {
      const repo = new IndexedDbCachedTagRepository(openIndexedDbDatabase());
      await repo.saveAll([new Tag('hello', new Date(123), 'a description')]);
      const [tag] = await repo.getAll();
      expect(tag.getName()).toBe('hello');
      expect(tag.getDescription()).toBe('a description');
      expect(tag.getLastUpdated().getTime()).toBe(123);
    });
  });

  describe('isAvailable', () => {
    it('should be available when IDB opens', async () => {
      const repo = new IndexedDbCachedTagRepository(openIndexedDbDatabase());
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
      const repo = new IndexedDbCachedTagRepository(openIndexedDbDatabase());
      await expect(
        repo.saveAll([new Tag('MyTag', new Date(0), 'd')])
      ).resolves.toBeUndefined();
      await expect(
        repo.update(new Tag('MyTag', new Date(0), 'd'))
      ).resolves.toBeUndefined();
      await expect(repo.delete('MyTag')).resolves.toBeUndefined();
      await expect(repo.clearCache()).resolves.toBeUndefined();
      expect(await repo.getAll()).toEqual([]);
      expect(await repo.isAvailable()).toBe(false);
    });
  });
});
