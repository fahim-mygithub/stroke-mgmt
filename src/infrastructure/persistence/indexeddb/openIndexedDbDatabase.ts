/**
 * Opens the `stroke-mgmt-cache` IndexedDB database used by the four web cached
 * repositories (articles, algorithms, tags, image_metadata).
 *
 * Returns a `Promise<IDBDatabase | null>`. Resolves to `null` (and emits a
 * one-time `console.warn`) when IndexedDB is not available — e.g. in private
 * browsing, when the user has blocked storage, or when the open request is
 * rejected for quota / version reasons. Callers are expected to short-circuit
 * to no-ops on null so the app keeps working against the network path.
 *
 * Each store uses its WebSQL primary key as `keyPath`:
 *   - articles       (keyPath: 'id')           + index on 'designation'
 *   - algorithms     (keyPath: 'id')
 *   - tags           (keyPath: 'name')
 *   - image_metadata (keyPath: 'sourceUrl')
 *
 * Schema versioning
 * -----------------
 * Current version: 1.
 *
 * TODO: To bump on a breaking shape change:
 *   1. Increment `DATABASE_VERSION` below.
 *   2. Extend the `onupgradeneeded` handler with a branch for the new version
 *      (`if (event.oldVersion < N) { … }`) that drops + recreates affected
 *      stores. The next online load will repopulate them via React Query.
 */

const DATABASE_NAME = 'stroke-mgmt-cache';
const DATABASE_VERSION = 1;

const STORE_ARTICLES = 'articles';
const STORE_ALGORITHMS = 'algorithms';
const STORE_TAGS = 'tags';
const STORE_IMAGE_METADATA = 'image_metadata';

let warnedOnce = false;

function warnUnavailableOnce(reason: unknown) {
  if (warnedOnce) return;
  warnedOnce = true;
  // eslint-disable-next-line no-console
  console.warn(
    '[stroke-mgmt] IndexedDB unavailable; offline cache disabled. ' +
      'App will hit the network on every load.',
    reason
  );
}

function applyV1Schema(db: IDBDatabase) {
  if (!db.objectStoreNames.contains(STORE_ARTICLES)) {
    const articles = db.createObjectStore(STORE_ARTICLES, { keyPath: 'id' });
    articles.createIndex('designation', 'designation', { unique: false });
  }
  if (!db.objectStoreNames.contains(STORE_ALGORITHMS)) {
    db.createObjectStore(STORE_ALGORITHMS, { keyPath: 'id' });
  }
  if (!db.objectStoreNames.contains(STORE_TAGS)) {
    db.createObjectStore(STORE_TAGS, { keyPath: 'name' });
  }
  if (!db.objectStoreNames.contains(STORE_IMAGE_METADATA)) {
    db.createObjectStore(STORE_IMAGE_METADATA, { keyPath: 'sourceUrl' });
  }
}

async function openIndexedDbDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined' || indexedDB === null) {
    warnUnavailableOnce(new Error('indexedDB global is not defined'));
    return null;
  }

  return new Promise<IDBDatabase | null>((resolve) => {
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    } catch (err) {
      warnUnavailableOnce(err);
      resolve(null);
      return;
    }

    request.onupgradeneeded = (event) => {
      const db = request.result;
      // Schema version 1: create all four stores. When bumping, branch on
      // `event.oldVersion` and apply the migration deltas in order.
      if (event.oldVersion < 1) {
        applyV1Schema(db);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      warnUnavailableOnce(request.error);
      resolve(null);
    };

    request.onblocked = () => {
      warnUnavailableOnce(new Error('IndexedDB open blocked by another tab'));
      resolve(null);
    };
  });
}

export {
  openIndexedDbDatabase,
  DATABASE_NAME,
  DATABASE_VERSION,
  STORE_ARTICLES,
  STORE_ALGORITHMS,
  STORE_TAGS,
  STORE_IMAGE_METADATA,
};
