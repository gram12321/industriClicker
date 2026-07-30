import * as SQLite from 'expo-sqlite';

import type { GameSnapshot } from '../state/gameSnapshot';
import { isPrestigeLedgerSnapshot } from '../../prestige/prestige';

const DATABASE_NAME = 'industri-clicker.db';
const SAVE_ROW_ID = 1;

type SaveRow = {
  snapshot_json: string;
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isGameTimeSnapshot(value: unknown): boolean {
  return isRecord(value)
    && typeof value.lastProcessedAtMs === 'number'
    && Number.isFinite(value.lastProcessedAtMs)
    && typeof value.unprocessedWorkMs === 'number'
    && Number.isFinite(value.unprocessedWorkMs)
    && value.unprocessedWorkMs >= 0
    && value.unprocessedWorkMs < 60_000
    && typeof value.customerPipelineProgress === 'number'
    && Number.isFinite(value.customerPipelineProgress)
    && value.customerPipelineProgress >= 0
    && value.customerPipelineProgress <= 1;
}

function isGameSnapshot(value: unknown): value is GameSnapshot {
  if (!isRecord(value) || !isRecord(value.finance) || !isRecord(value.inventory) || !isRecord(value.facilities) || !isRecord(value.salesContracts) || !isRecord(value.prestige) || !isRecord(value.time)) {
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
    && isPrestigeLedgerSnapshot(value.prestige)
    && isGameTimeSnapshot(value.time)
  );
}

function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME)
      .then(async (database) => {
        await database.execAsync(`
      CREATE TABLE IF NOT EXISTS game_save (
        id INTEGER PRIMARY KEY NOT NULL,
        snapshot_json TEXT NOT NULL
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

/** Loads the single local save when its snapshot is valid. */
export async function loadGameSnapshot(): Promise<GameSnapshot | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<SaveRow>(
    'SELECT snapshot_json FROM game_save WHERE id = ?',
    SAVE_ROW_ID,
  );

  if (!row) {
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
    `INSERT INTO game_save (id, snapshot_json)
     VALUES (?, ?)
     ON CONFLICT(id) DO UPDATE SET
       snapshot_json = excluded.snapshot_json`,
    SAVE_ROW_ID,
    JSON.stringify(snapshot),
  );
}

/** Clears the single local save for an admin-triggered fresh start. */
export async function resetGameSave(): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM game_save WHERE id = ?', SAVE_ROW_ID);
}
