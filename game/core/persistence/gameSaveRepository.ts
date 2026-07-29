import * as SQLite from 'expo-sqlite';

import type { GameSnapshot } from '../state/gameSnapshot';

const DATABASE_NAME = 'industri-clicker.db';
const SAVE_VERSION = 4;
const SAVE_ROW_ID = 1;

type SaveRow = {
  snapshot_json: string;
  version: number;
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isGameSnapshot(value: unknown): value is GameSnapshot {
  if (!isRecord(value) || !isRecord(value.finance) || !isRecord(value.inventory) || !isRecord(value.facilities) || !isRecord(value.salesContracts)) {
    return false;
  }

  return (
    typeof value.finance.balance === 'number'
    && Array.isArray(value.finance.transactions)
    && isRecord(value.inventory.entries)
    && Array.isArray(value.facilities.facilities)
    && Array.isArray(value.salesContracts.offered)
    && Array.isArray(value.salesContracts.completed)
    && typeof value.salesContracts.nextCustomerNumber === 'number'
  );
}

function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME)
      .then(async (database) => {
        await database.execAsync(`
      CREATE TABLE IF NOT EXISTS game_save (
        id INTEGER PRIMARY KEY NOT NULL,
        version INTEGER NOT NULL,
        snapshot_json TEXT NOT NULL,
        saved_at TEXT NOT NULL
      );
    `);

        return database;
      })
      .catch((error) => {
        // Allow a later action to retry after a transient native or web error.
        databasePromise = null;
        throw error;
      });
  }

  return databasePromise;
}

/** Loads the single local save when it has the current supported shape. */
export async function loadGameSnapshot(): Promise<GameSnapshot | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<SaveRow>(
    'SELECT version, snapshot_json FROM game_save WHERE id = ?',
    SAVE_ROW_ID,
  );

  if (!row || row.version !== SAVE_VERSION) {
    return null;
  }

  try {
    const snapshot: unknown = JSON.parse(row.snapshot_json);
    return isGameSnapshot(snapshot) ? snapshot : null;
  } catch {
    return null;
  }
}

/** Replaces the single device-local save with the current plain game snapshot. */
export async function saveGameSnapshot(snapshot: GameSnapshot): Promise<void> {
  const database = await getDatabase();

  await database.runAsync(
    `INSERT INTO game_save (id, version, snapshot_json, saved_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       version = excluded.version,
       snapshot_json = excluded.snapshot_json,
       saved_at = excluded.saved_at`,
    SAVE_ROW_ID,
    SAVE_VERSION,
    JSON.stringify(snapshot),
    new Date().toISOString(),
  );
}
