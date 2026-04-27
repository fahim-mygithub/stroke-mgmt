import type {
  Algorithm,
  AlgorithmId,
  AlgorithmVisitor,
  CachedAlgorithmRepository,
  ScoredAlgorithm,
  TextAlgorithm,
} from '@/domain/models/Algorithm';
import {
  awaitRequest,
  awaitTransaction,
} from '@/infrastructure/persistence/indexeddb/helpers';
import { STORE_ALGORITHMS } from '@/infrastructure/persistence/indexeddb/openIndexedDbDatabase';
import { cachedAlgorithmRowToAlgorithm } from '@/infrastructure/persistence/websql/WebsqlCachedAlgorithmRepository/cachedAlgorithmRowToAlgorithm';
import { serializeOutcomes } from '@/infrastructure/persistence/websql/WebsqlCachedAlgorithmRepository/serializeOutcomes';
import { serializeSwitches } from '@/infrastructure/persistence/websql/WebsqlCachedAlgorithmRepository/serializeSwitches';
import type { CachedAlgorithmRow } from '@/infrastructure/persistence/websql/WebsqlCachedAlgorithmRepository/tableSchema';

function makeRowFromTextAlgorithm(algo: TextAlgorithm): CachedAlgorithmRow {
  return {
    id: algo.getId().toString(),
    title: algo.getTitle(),
    summary: algo.getSummary(),
    body: algo.getBody(),
    thumbnailUri: algo.getThumbnail().getUri(),
    outcomesJson: serializeOutcomes(algo.getOutcomes()),
    shouldShowOnHomeScreen: algo.getShouldShowOnHomeScreen() ? 1 : 0,
    lastUpdatedTimestamp: algo.getLastUpdated().getTime(),
    switchesJson: '[]',
    type: algo.type,
    citationsJson: JSON.stringify(algo.getCitations()),
  };
}

function makeRowFromScoredAlgorithm(algo: ScoredAlgorithm): CachedAlgorithmRow {
  return {
    id: algo.getId().toString(),
    title: algo.getTitle(),
    summary: algo.getSummary(),
    body: algo.getBody(),
    thumbnailUri: algo.getThumbnail().getUri(),
    outcomesJson: serializeOutcomes(algo.getOutcomes()),
    shouldShowOnHomeScreen: algo.getShouldShowOnHomeScreen() ? 1 : 0,
    lastUpdatedTimestamp: algo.getLastUpdated().getTime(),
    switchesJson: serializeSwitches(algo.getSwitches()),
    type: algo.type,
    citationsJson: JSON.stringify(algo.getCitations()),
  };
}

function algorithmToRow(algorithm: Algorithm): CachedAlgorithmRow {
  let row: CachedAlgorithmRow | undefined;
  const visitor: AlgorithmVisitor = {
    visitTextAlgorithm(a) {
      row = makeRowFromTextAlgorithm(a);
    },
    visitScoredAlgorithm(a) {
      row = makeRowFromScoredAlgorithm(a);
    },
  };
  algorithm.acceptVisitor(visitor);
  if (!row)
    throw new Error(
      `Algorithm (type=${algorithm.type}) was not visited when serializing for IDB`
    );
  return row;
}

class IndexedDbCachedAlgorithmRepository implements CachedAlgorithmRepository {
  ready: Promise<void>;

  constructor(
    private readonly indexedDbDatabase: Promise<IDBDatabase | null>
  ) {
    this.ready = indexedDbDatabase.then(() => undefined);
  }

  static $inject = ['indexedDbDatabase'];

  async isEmpty(): Promise<boolean> {
    const db = await this.indexedDbDatabase;
    if (!db) return true;
    const tx = db.transaction(STORE_ALGORITHMS, 'readonly');
    const count = await awaitRequest(tx.objectStore(STORE_ALGORITHMS).count());
    return count === 0;
  }

  async saveAll(algorithms: Algorithm[]): Promise<void> {
    const db = await this.indexedDbDatabase;
    if (!db) return;
    const tx = db.transaction(STORE_ALGORITHMS, 'readwrite');
    const store = tx.objectStore(STORE_ALGORITHMS);
    algorithms.forEach((a) => store.put(algorithmToRow(a)));
    await awaitTransaction(tx);
  }

  async update(algorithm: Algorithm): Promise<void> {
    const db = await this.indexedDbDatabase;
    if (!db) return;
    const tx = db.transaction(STORE_ALGORITHMS, 'readwrite');
    tx.objectStore(STORE_ALGORITHMS).put(algorithmToRow(algorithm));
    await awaitTransaction(tx);
  }

  async delete(id: AlgorithmId): Promise<void> {
    const db = await this.indexedDbDatabase;
    if (!db) return;
    const tx = db.transaction(STORE_ALGORITHMS, 'readwrite');
    tx.objectStore(STORE_ALGORITHMS).delete(id.toString());
    await awaitTransaction(tx);
  }

  async clearCache(): Promise<void> {
    const db = await this.indexedDbDatabase;
    if (!db) return;
    const tx = db.transaction(STORE_ALGORITHMS, 'readwrite');
    tx.objectStore(STORE_ALGORITHMS).clear();
    await awaitTransaction(tx);
  }

  async getAll(): Promise<Algorithm[]> {
    const db = await this.indexedDbDatabase;
    if (!db) return [];
    const tx = db.transaction(STORE_ALGORITHMS, 'readonly');
    const rows = await awaitRequest<CachedAlgorithmRow[]>(
      tx.objectStore(STORE_ALGORITHMS).getAll()
    );
    return rows.map(cachedAlgorithmRowToAlgorithm);
  }

  async getById(id: AlgorithmId): Promise<Algorithm> {
    const db = await this.indexedDbDatabase;
    // Mirrors the WebSQL repo: getById passes the (possibly-undefined) row
    // straight to the row-to-algorithm reconstructor. If the row is missing,
    // accessing `row.type` throws TypeError — matching native behavior.
    if (!db) {
      return cachedAlgorithmRowToAlgorithm(
        undefined as unknown as CachedAlgorithmRow
      );
    }
    const tx = db.transaction(STORE_ALGORITHMS, 'readonly');
    const row = await awaitRequest<CachedAlgorithmRow | undefined>(
      tx.objectStore(STORE_ALGORITHMS).get(id.toString())
    );
    return cachedAlgorithmRowToAlgorithm(row as CachedAlgorithmRow);
  }

  async getAllShownOnHomeScreen(): Promise<Algorithm[]> {
    const db = await this.indexedDbDatabase;
    if (!db) return [];
    const tx = db.transaction(STORE_ALGORITHMS, 'readonly');
    const rows = await awaitRequest<CachedAlgorithmRow[]>(
      tx.objectStore(STORE_ALGORITHMS).getAll()
    );
    return rows
      .filter((r) => r.shouldShowOnHomeScreen === 1)
      .map(cachedAlgorithmRowToAlgorithm);
  }

  async isAvailable(): Promise<boolean> {
    const db = await this.indexedDbDatabase;
    return db !== null;
  }
}

export { IndexedDbCachedAlgorithmRepository };
