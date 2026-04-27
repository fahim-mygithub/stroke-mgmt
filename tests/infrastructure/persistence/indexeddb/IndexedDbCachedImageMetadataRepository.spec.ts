import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { CachedImageMetadata } from '@/domain/models/Image';
import { IndexedDbCachedImageMetadataRepository } from '@/infrastructure/persistence/indexeddb/IndexedDbCachedImageMetadataRepository';
import { openIndexedDbDatabase } from '@/infrastructure/persistence/indexeddb/openIndexedDbDatabase';

describe('IndexedDbCachedImageMetadataRepository', () => {
  beforeEach(() => {
    (globalThis as unknown as { indexedDB: unknown }).indexedDB =
      new IDBFactory();
  });

  describe('Instantiation', () => {
    it('should be created with an indexeddb database promise', () => {
      const create = () =>
        new IndexedDbCachedImageMetadataRepository(openIndexedDbDatabase());
      expect(create).not.toThrow();
    });
  });

  describe('save + get', () => {
    it('should save and retrieve image metadata by sourceUrl', async () => {
      const repo = new IndexedDbCachedImageMetadataRepository(
        openIndexedDbDatabase()
      );
      const metadata = new CachedImageMetadata(
        'https://wordpress.com/foo.png',
        'file://cachedir/foo.png',
        'image/png'
      );
      await repo.save(metadata);
      const result = await repo.get('https://wordpress.com/foo.png');
      expect(result).not.toBeNull();
      expect(result?.getFilePath()).toBe('file://cachedir/foo.png');
      expect(result?.getMimeType()).toBe('image/png');
    });

    it('should return null when sourceUrl is missing', async () => {
      const repo = new IndexedDbCachedImageMetadataRepository(
        openIndexedDbDatabase()
      );
      const result = await repo.get('https://nonexistent.example/x.png');
      expect(result).toBeNull();
    });

    it('should upsert when called twice for the same sourceUrl', async () => {
      const repo = new IndexedDbCachedImageMetadataRepository(
        openIndexedDbDatabase()
      );
      const a = new CachedImageMetadata(
        'https://wordpress.com/foo.png',
        'file://cachedir/old.png',
        'image/png'
      );
      const b = new CachedImageMetadata(
        'https://wordpress.com/foo.png',
        'file://cachedir/new.png',
        'image/png'
      );
      await repo.save(a);
      await repo.save(b);
      const result = await repo.get('https://wordpress.com/foo.png');
      expect(result?.getFilePath()).toBe('file://cachedir/new.png');
    });
  });

  describe('clearCache', () => {
    it('should remove all stored metadata', async () => {
      const repo = new IndexedDbCachedImageMetadataRepository(
        openIndexedDbDatabase()
      );
      await repo.save(
        new CachedImageMetadata('https://a.example/x.png', 'a.png', 'image/png')
      );
      await repo.save(
        new CachedImageMetadata('https://b.example/y.png', 'b.png', 'image/png')
      );
      await repo.clearCache();
      expect(await repo.get('https://a.example/x.png')).toBeNull();
      expect(await repo.get('https://b.example/y.png')).toBeNull();
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

    it('should no-op writes and return null on reads', async () => {
      const repo = new IndexedDbCachedImageMetadataRepository(
        openIndexedDbDatabase()
      );
      await expect(
        repo.save(
          new CachedImageMetadata(
            'https://wordpress.com/foo.png',
            'foo.png',
            'image/png'
          )
        )
      ).resolves.toBeUndefined();
      await expect(repo.clearCache()).resolves.toBeUndefined();
      expect(await repo.get('https://wordpress.com/foo.png')).toBeNull();
    });
  });
});
