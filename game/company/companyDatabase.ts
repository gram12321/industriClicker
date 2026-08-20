import type { GameSnapshot } from '@/game/core/state/gameSnapshot';
import { getLocalDatabase } from '@/game/core/persistence/localDatabase';
import { createCompanyTutorialState, ensureTutorialDatabase } from '@/game/tutorial/tutorialDatabase';
import {
  EMPTY_DEVICE_SESSION,
  type DeviceSession,
  type LocalCompany,
  type LocalPlayerProfile,
  type StartingConditionId,
} from './companyTypes';

type ProfileRow = { id: string; display_name: string; created_at: string; updated_at: string };
type CompanyRow = { id: string; owner_profile_id: string; display_name: string; starting_condition_id: StartingConditionId; created_at: string; updated_at: string };
type SessionRow = { selected_profile_id: string | null; active_company_id: string | null };
type SaveRow = { snapshot_json: string };

let companyDatabasePromise: ReturnType<typeof getLocalDatabase> | null = null;

function mapProfile(row: ProfileRow): LocalPlayerProfile {
  return { id: row.id, displayName: row.display_name, createdAt: row.created_at, updatedAt: row.updated_at };
}

function mapCompany(row: CompanyRow): LocalCompany {
  return {
    id: row.id,
    ownerProfileId: row.owner_profile_id,
    displayName: row.display_name,
    startingConditionId: row.starting_condition_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getDatabase() {
  if (!companyDatabasePromise) {
    companyDatabasePromise = getLocalDatabase().then(async (database) => {
      // The old singleton save is intentionally invalidated by this company-scoped save shape.
      await database.execAsync('DROP TABLE IF EXISTS game_save;');
      // The temporary theme placeholder is intentionally discarded; themes are not a v1 feature.
      await database.execAsync('DROP TABLE IF EXISTS profile_preferences;');
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS local_profiles (
          id TEXT PRIMARY KEY NOT NULL,
          display_name TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS companies (
          id TEXT PRIMARY KEY NOT NULL,
          owner_profile_id TEXT NOT NULL REFERENCES local_profiles(id),
          display_name TEXT NOT NULL,
          normalized_name TEXT NOT NULL,
          starting_condition_id TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          UNIQUE(owner_profile_id, normalized_name)
        );
        CREATE TABLE IF NOT EXISTS company_saves (
          company_id TEXT PRIMARY KEY NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
          snapshot_json TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS device_session (
          id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
          selected_profile_id TEXT REFERENCES local_profiles(id) ON DELETE SET NULL,
          active_company_id TEXT REFERENCES companies(id) ON DELETE SET NULL
        );
      `);
      await ensureTutorialDatabase(database);
      return database;
    }).catch((error) => {
      companyDatabasePromise = null;
      throw error;
    });
  }
  return companyDatabasePromise;
}

export async function listLocalProfiles(): Promise<LocalPlayerProfile[]> {
  const database = await getDatabase();
  return (await database.getAllAsync<ProfileRow>('SELECT id, display_name, created_at, updated_at FROM local_profiles ORDER BY updated_at DESC'))
    .map(mapProfile);
}

export async function createLocalProfile(profile: LocalPlayerProfile): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('INSERT INTO local_profiles (id, display_name, created_at, updated_at) VALUES (?, ?, ?, ?)', profile.id, profile.displayName, profile.createdAt, profile.updatedAt);
}

export async function listCompaniesForProfile(profileId: string): Promise<LocalCompany[]> {
  const database = await getDatabase();
  return (await database.getAllAsync<CompanyRow>(
    'SELECT id, owner_profile_id, display_name, starting_condition_id, created_at, updated_at FROM companies WHERE owner_profile_id = ? ORDER BY updated_at DESC',
    profileId,
  )).map(mapCompany);
}

export async function createCompanyWithSave(input: { company: LocalCompany; snapshot: GameSnapshot }): Promise<void> {
  const database = await getDatabase();
  const normalizedName = input.company.displayName.toLocaleLowerCase();
  await database.withTransactionAsync(async () => {
    await database.runAsync(
      'INSERT INTO companies (id, owner_profile_id, display_name, normalized_name, starting_condition_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      input.company.id, input.company.ownerProfileId, input.company.displayName, normalizedName, input.company.startingConditionId, input.company.createdAt, input.company.updatedAt,
    );
    await database.runAsync('INSERT INTO company_saves (company_id, snapshot_json, updated_at) VALUES (?, ?, ?)', input.company.id, JSON.stringify(input.snapshot), input.company.updatedAt);
    await createCompanyTutorialState(database, input.company.id);
  });
}

/** Deletes one company and all company-scoped rows via foreign-key cascades. */
export async function deleteCompany(companyId: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM companies WHERE id = ?', companyId);
}

/** Clears all player-owned local data while keeping the current empty schema ready for a new session. */
export async function clearLocalData(): Promise<void> {
  const database = await getDatabase();
  await database.withTransactionAsync(async () => {
    await database.runAsync('DELETE FROM device_session');
    await database.runAsync('DELETE FROM companies');
    await database.runAsync('DELETE FROM local_profiles');
  });
}

export async function loadCompanySnapshot(companyId: string): Promise<GameSnapshot | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<SaveRow>('SELECT snapshot_json FROM company_saves WHERE company_id = ?', companyId);
  if (!row) return null;
  try {
    return JSON.parse(row.snapshot_json) as GameSnapshot;
  } catch {
    return null;
  }
}

export async function saveCompanySnapshot(companyId: string, snapshot: GameSnapshot): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO company_saves (company_id, snapshot_json, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(company_id) DO UPDATE SET snapshot_json = excluded.snapshot_json, updated_at = excluded.updated_at`,
    companyId, JSON.stringify(snapshot), new Date().toISOString(),
  );
}

export async function loadDeviceSession(): Promise<DeviceSession> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<SessionRow>('SELECT selected_profile_id, active_company_id FROM device_session WHERE id = 1');
  return row ? { selectedProfileId: row.selected_profile_id, activeCompanyId: row.active_company_id } : EMPTY_DEVICE_SESSION;
}

export async function saveDeviceSession(session: DeviceSession): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO device_session (id, selected_profile_id, active_company_id) VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET selected_profile_id = excluded.selected_profile_id, active_company_id = excluded.active_company_id`,
    session.selectedProfileId, session.activeCompanyId,
  );
}
