import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'industri-clicker.db';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Returns the shared device-local database connection used by local-first domains. */
export async function getLocalDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME).then(async (database) => {
      await database.execAsync('PRAGMA foreign_keys = ON;');
      return database;
    }).catch((error) => {
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
}
