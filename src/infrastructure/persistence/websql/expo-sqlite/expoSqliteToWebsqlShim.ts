import type { SQLiteDatabase } from 'expo-sqlite';

type QueuedQuery = {
  sql: string;
  args: readonly (number | string | null)[];
  succCb?: SQLStatementCallback;
  errCb?: SQLStatementErrorCallback;
};

function buildResultSet<T>(
  rows: T[],
  rowsAffected: number,
  insertId: number
): SQLResultSet {
  return {
    rowsAffected,
    insertId,
    rows: {
      length: rows.length,
      item: (i: number) => rows[i] as unknown as object,
      _array: rows as unknown as object[],
    } as SQLResultSetRowList,
  };
}

async function runQuery(
  sqliteDb: SQLiteDatabase,
  tx: SQLTransaction,
  q: QueuedQuery
): Promise<void> {
  let statement;
  try {
    statement = await sqliteDb.prepareAsync(q.sql);
  } catch (e) {
    const err = e as SQLError;
    const rollback = q.errCb ? q.errCb(tx, err) : true;
    if (rollback) throw e;
    return;
  }
  try {
    const execResult = await statement.executeAsync<object>(
      q.args as (number | string | null)[]
    );
    const allRows = await execResult.getAllAsync();
    const rs = buildResultSet(
      allRows,
      execResult.changes,
      execResult.lastInsertRowId
    );
    if (q.succCb) q.succCb(tx, rs);
  } catch (e) {
    const err = e as SQLError;
    const rollback = q.errCb ? q.errCb(tx, err) : true;
    if (rollback) throw e;
  } finally {
    await statement.finalizeAsync();
  }
}

function makeTransaction(
  sqliteDb: SQLiteDatabase
): { tx: SQLTransaction; drain: () => Promise<void> } {
  const pending: QueuedQuery[] = [];
  const tx: SQLTransaction = {
    executeSql: (sql, args, succCb, errCb) => {
      pending.push({
        sql: String(sql),
        args: args ?? [],
        succCb,
        errCb,
      });
    },
  };

  const drain = async () => {
    // Yield once so callers (who `.then` into tx.executeSql) can queue first.
    await Promise.resolve();
    while (pending.length > 0) {
      const q = pending.shift()!;
      await runQuery(sqliteDb, tx, q);
      // Yield again so success callbacks can enqueue more work before we exit.
      await Promise.resolve();
    }
  };

  return { tx, drain };
}

function wrapSQLiteDatabase(sqliteDb: SQLiteDatabase): Database {
  const runTx = (
    readOnly: boolean,
    txCallback: SQLTransactionCallback,
    errorCallback?: SQLTransactionErrorCallback,
    successCallback?: SQLVoidCallback
  ) => {
    const run = async () => {
      const { tx, drain } = makeTransaction(sqliteDb);
      try {
        if (readOnly) {
          txCallback(tx);
          await drain();
        } else {
          await sqliteDb.withTransactionAsync(async () => {
            txCallback(tx);
            await drain();
          });
        }
        if (successCallback) successCallback();
      } catch (err) {
        if (errorCallback) errorCallback(err as SQLError);
      }
    };
    // Fire and forget — WebSQL's transaction API is not awaitable.
    void run();
  };

  const db: Database = {
    version: '1.0',
    transaction: (txCallback, errorCallback, successCallback) =>
      runTx(false, txCallback, errorCallback, successCallback),
    readTransaction: (txCallback, errorCallback, successCallback) =>
      runTx(true, txCallback, errorCallback, successCallback),
    changeVersion: () => {
      throw new Error('changeVersion is not supported by this shim');
    },
  };
  return db;
}

export { wrapSQLiteDatabase };
