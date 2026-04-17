// Web build does not need a real SQLite database. The Websql*CachedRepository
// classes are an optimization layer that caches Strapi responses; skipping the
// cache means every load hits the network, which is acceptable for the web
// review build. A full SQLite-on-web implementation requires either
// SharedArrayBuffer (blocked by COOP/COEP hosting constraints) or a WASM
// alternative like sql.js — not worth the complexity for review purposes.

function makeEmptyResultSet(): SQLResultSet {
  return {
    rowsAffected: 0,
    insertId: undefined as unknown as number,
    rows: {
      length: 0,
      item: () => undefined as unknown as object,
      _array: [] as unknown as object[],
    } as SQLResultSetRowList,
  };
}

function makeTransaction(): SQLTransaction {
  return {
    executeSql: (_sql, _args, succCb) => {
      if (succCb) {
        queueMicrotask(() => {
          const tx = makeTransaction();
          succCb(tx, makeEmptyResultSet());
        });
      }
    },
  };
}

export function openExpoSqliteDatabase(): Database {
  return {
    version: '1.0' as unknown as DOMString,
    transaction: (txCallback, _errorCallback, successCallback) => {
      queueMicrotask(() => {
        txCallback(makeTransaction());
        if (successCallback) queueMicrotask(successCallback);
      });
    },
    readTransaction: (txCallback, _errorCallback, successCallback) => {
      queueMicrotask(() => {
        txCallback(makeTransaction());
        if (successCallback) queueMicrotask(successCallback);
      });
    },
    changeVersion: () => {
      throw new Error('changeVersion is not supported on web');
    },
  };
}
