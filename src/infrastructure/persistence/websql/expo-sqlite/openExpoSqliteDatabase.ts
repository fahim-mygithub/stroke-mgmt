import { openDatabaseSync } from 'expo-sqlite';
import { wrapSQLiteDatabase } from '@/infrastructure/persistence/websql/expo-sqlite/expoSqliteToWebsqlShim';

export function openExpoSqliteDatabase() {
  const sqliteDb = openDatabaseSync('database-v1.db');
  return wrapSQLiteDatabase(sqliteDb);
}
