import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import {
  ALGORITHM_TYPES,
  AlgorithmId,
  AlgorithmInfo,
  ScoredAlgorithm,
  SwitchId,
  TextAlgorithm,
  YesNoSwitch,
} from '@/domain/models/Algorithm';
import { Citation } from '@/domain/models/Citation';
import { NullImage } from '@/domain/models/Image/NullImage';
import { IndexedDbCachedAlgorithmRepository } from '@/infrastructure/persistence/indexeddb/IndexedDbCachedAlgorithmRepository';
import { openIndexedDbDatabase } from '@/infrastructure/persistence/indexeddb/openIndexedDbDatabase';

const makeTextAlgorithm = (
  id: string,
  shouldShowOnHomeScreen = true
): TextAlgorithm => {
  const info = new AlgorithmInfo({
    id: new AlgorithmId(id),
    title: `Algorithm ${id}`,
    summary: `Summary ${id}`,
    body: `<h1>Body ${id}</h1>`,
    thumbnail: new NullImage(),
    outcomes: [],
    shouldShowOnHomeScreen,
    lastUpdated: new Date(0),
    citations: [],
  });
  return new TextAlgorithm({ info });
};

const makeScoredAlgorithm = (
  id: string,
  shouldShowOnHomeScreen = true
): ScoredAlgorithm => {
  const info = new AlgorithmInfo({
    id: new AlgorithmId(id),
    title: `Algorithm ${id}`,
    summary: `Summary ${id}`,
    body: `<h1>Body ${id}</h1>`,
    thumbnail: new NullImage(),
    outcomes: [],
    shouldShowOnHomeScreen,
    lastUpdated: new Date(0),
    citations: [new Citation('My Citation')],
  });
  return new ScoredAlgorithm({
    info,
    switches: [
      new YesNoSwitch({
        id: new SwitchId('0'),
        label: `Switch ${id}`,
        valueIfActive: 1,
      }),
    ],
  });
};

describe('IndexedDbCachedAlgorithmRepository', () => {
  beforeEach(() => {
    (globalThis as unknown as { indexedDB: unknown }).indexedDB =
      new IDBFactory();
  });

  describe('Instantiation', () => {
    it('should be created with an indexeddb database promise', () => {
      const create = () =>
        new IndexedDbCachedAlgorithmRepository(openIndexedDbDatabase());
      expect(create).not.toThrow();
    });
  });

  describe('isEmpty', () => {
    it('should be empty on instantiation', async () => {
      const repo = new IndexedDbCachedAlgorithmRepository(
        openIndexedDbDatabase()
      );
      expect(await repo.isEmpty()).toBe(true);
    });

    it('should not be empty after saving', async () => {
      const repo = new IndexedDbCachedAlgorithmRepository(
        openIndexedDbDatabase()
      );
      await repo.saveAll([makeTextAlgorithm('1')]);
      expect(await repo.isEmpty()).toBe(false);
    });
  });

  describe('saveAll', () => {
    it('should save a mix of text and scored algorithms', async () => {
      const repo = new IndexedDbCachedAlgorithmRepository(
        openIndexedDbDatabase()
      );
      const text = makeTextAlgorithm('0');
      const scored = makeScoredAlgorithm('1');
      await repo.saveAll([text, scored]);
      const all = await repo.getAll();
      expect(all).toHaveLength(2);
      const sorted = [...all].sort((a, b) =>
        a.getId().toString().localeCompare(b.getId().toString())
      );
      expect(sorted[0].type).toBe(ALGORITHM_TYPES.TEXT_ALGORITHM);
      expect(sorted[1].type).toBe(ALGORITHM_TYPES.SCORED_ALGORITHM);
    });
  });

  describe('update', () => {
    it('should overwrite an existing algorithm', async () => {
      const repo = new IndexedDbCachedAlgorithmRepository(
        openIndexedDbDatabase()
      );
      await repo.saveAll([makeTextAlgorithm('1')]);
      const replacement = makeTextAlgorithm('1');
      await repo.update(replacement);
      const fetched = await repo.getById(new AlgorithmId('1'));
      expect(fetched.getId().toString()).toBe('1');
      expect(fetched.type).toBe(ALGORITHM_TYPES.TEXT_ALGORITHM);
    });
  });

  describe('delete', () => {
    it('should delete an algorithm by id', async () => {
      const repo = new IndexedDbCachedAlgorithmRepository(
        openIndexedDbDatabase()
      );
      await repo.saveAll([makeTextAlgorithm('1'), makeTextAlgorithm('2')]);
      await repo.delete(new AlgorithmId('1'));
      const remaining = await repo.getAll();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].getId().toString()).toBe('2');
    });
  });

  describe('clearCache', () => {
    it('should remove all algorithms', async () => {
      const repo = new IndexedDbCachedAlgorithmRepository(
        openIndexedDbDatabase()
      );
      await repo.saveAll([makeTextAlgorithm('1'), makeTextAlgorithm('2')]);
      await repo.clearCache();
      expect(await repo.getAll()).toHaveLength(0);
    });
  });

  describe('getById', () => {
    it('should get a text algorithm', async () => {
      const repo = new IndexedDbCachedAlgorithmRepository(
        openIndexedDbDatabase()
      );
      await repo.saveAll([makeTextAlgorithm('2')]);
      const result = await repo.getById(new AlgorithmId('2'));
      expect(result.getId().toString()).toBe('2');
      expect(result.type).toBe(ALGORITHM_TYPES.TEXT_ALGORITHM);
    });

    it('should get a scored algorithm', async () => {
      const repo = new IndexedDbCachedAlgorithmRepository(
        openIndexedDbDatabase()
      );
      const scored = makeScoredAlgorithm('3');
      await repo.saveAll([scored]);
      const result = (await repo.getById(
        new AlgorithmId('3')
      )) as ScoredAlgorithm;
      expect(result.type).toBe(ALGORITHM_TYPES.SCORED_ALGORITHM);
      expect(result.getSwitches()).toHaveLength(1);
    });
  });

  describe('getAllShownOnHomeScreen', () => {
    it('should only get algorithms with shouldShowOnHomeScreen=true', async () => {
      const repo = new IndexedDbCachedAlgorithmRepository(
        openIndexedDbDatabase()
      );
      await repo.saveAll([
        makeTextAlgorithm('1', true),
        makeTextAlgorithm('2', false),
        makeScoredAlgorithm('3', true),
      ]);
      const visible = await repo.getAllShownOnHomeScreen();
      const ids = visible.map((a) => a.getId().toString()).sort();
      expect(ids).toEqual(['1', '3']);
    });
  });

  describe('isAvailable', () => {
    it('should be available when IDB opens', async () => {
      const repo = new IndexedDbCachedAlgorithmRepository(
        openIndexedDbDatabase()
      );
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
      const repo = new IndexedDbCachedAlgorithmRepository(
        openIndexedDbDatabase()
      );
      const algo = makeTextAlgorithm('1');
      await expect(repo.saveAll([algo])).resolves.toBeUndefined();
      await expect(repo.update(algo)).resolves.toBeUndefined();
      await expect(repo.delete(new AlgorithmId('1'))).resolves.toBeUndefined();
      await expect(repo.clearCache()).resolves.toBeUndefined();
      expect(await repo.isEmpty()).toBe(true);
      expect(await repo.getAll()).toEqual([]);
      expect(await repo.getAllShownOnHomeScreen()).toEqual([]);
      expect(await repo.isAvailable()).toBe(false);
    });
  });
});
