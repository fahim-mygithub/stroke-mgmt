/**
 * Tiny callback-to-Promise adapters for IndexedDB. The IDB API is built on
 * `IDBRequest` and `IDBTransaction`, both of which fire success/error events
 * rather than returning promises — wrap once, await everywhere.
 */

function awaitRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function awaitTransaction(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export { awaitRequest, awaitTransaction };
