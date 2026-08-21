import type { SQLiteDatabase } from 'expo-sqlite';
import { getLocalDatabase } from '@/game/core/persistence/localDatabase';
import { DEFAULT_TUTORIAL_STATE, type TutorialState } from './tutorialState';

type TutorialRow = { completed_welcome: number };

export async function ensureTutorialDatabase(database: SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS company_tutorial_state (
      company_id TEXT PRIMARY KEY NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      completed_welcome INTEGER NOT NULL
    );
  `);
}

export async function createCompanyTutorialState(database: SQLiteDatabase, companyId: string): Promise<void> {
  await database.runAsync('INSERT INTO company_tutorial_state (company_id, completed_welcome) VALUES (?, ?)', companyId, DEFAULT_TUTORIAL_STATE.completedWelcome ? 1 : 0);
}

async function getTutorialDatabase(): Promise<SQLiteDatabase> {
  const database = await getLocalDatabase();
  await ensureTutorialDatabase(database);
  return database;
}

export async function loadTutorialState(companyId: string): Promise<TutorialState> {
  const database = await getTutorialDatabase();
  const row = await database.getFirstAsync<TutorialRow>('SELECT completed_welcome FROM company_tutorial_state WHERE company_id = ?', companyId);
  return row ? { completedWelcome: row.completed_welcome === 1 } : DEFAULT_TUTORIAL_STATE;
}

export async function saveTutorialState(companyId: string, state: TutorialState): Promise<void> {
  const database = await getTutorialDatabase();
  await database.runAsync(
    `INSERT INTO company_tutorial_state (company_id, completed_welcome) VALUES (?, ?)
     ON CONFLICT(company_id) DO UPDATE SET completed_welcome = excluded.completed_welcome`,
    companyId, state.completedWelcome ? 1 : 0,
  );
}
