import type { SQLiteDatabase } from 'expo-sqlite';
import type { GameSnapshot } from '@/game/core/state';
import { getLocalDatabase } from './localDatabase';

type SaveRow = { snapshot_json: string };

export async function ensureGameSaveDatabase(database: SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS company_saves (
      company_id TEXT PRIMARY KEY NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      snapshot_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

export async function createCompanyGameSave(database: SQLiteDatabase, companyId: string, snapshot: GameSnapshot, updatedAt: string): Promise<void> {
  await database.runAsync('INSERT INTO company_saves (company_id, snapshot_json, updated_at) VALUES (?, ?, ?)', companyId, JSON.stringify(snapshot), updatedAt);
}

async function getGameSaveDatabase(): Promise<SQLiteDatabase> {
  const database = await getLocalDatabase();
  await ensureGameSaveDatabase(database);
  return database;
}

export async function loadCompanyGameSave(companyId: string): Promise<GameSnapshot | null> {
  const database = await getGameSaveDatabase();
  const row = await database.getFirstAsync<SaveRow>('SELECT snapshot_json FROM company_saves WHERE company_id = ?', companyId);
  if (!row) return null;
  try {
    return JSON.parse(row.snapshot_json) as GameSnapshot;
  } catch {
    return null;
  }
}

export async function saveCompanyGameSave(companyId: string, snapshot: GameSnapshot): Promise<void> {
  const database = await getGameSaveDatabase();
  await database.runAsync(
    `INSERT INTO company_saves (company_id, snapshot_json, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(company_id) DO UPDATE SET snapshot_json = excluded.snapshot_json, updated_at = excluded.updated_at`,
    companyId, JSON.stringify(snapshot), new Date().toISOString(),
  );
}
