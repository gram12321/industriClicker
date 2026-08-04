import { create } from 'zustand';
import { isGameSnapshot } from '@/game/core/state';
import { createStartingGameSnapshot, useGameStore } from '@/game/core/stores';
import { clearLocalData, createCompanyWithSave, createLocalProfile, deleteCompany, listCompaniesForProfile, listLocalProfiles, loadCompanySnapshot, loadCompanyTutorialState, loadDeviceSession, saveCompanySnapshot, saveCompanyTutorialState, saveDeviceSession } from './companyDatabase';
import { STARTING_CONDITIONS } from './companyConstants';
import { createLocalId, DEFAULT_COMPANY_TUTORIAL_STATE, EMPTY_DEVICE_SESSION, normalizeDisplayName, type CompanyTutorialState, type LocalCompany, type LocalPlayerProfile, type StartingConditionId, validateDisplayName } from './companyTypes';

type CompanySessionState = {
  isInitialized: boolean;
  isSwitching: boolean;
  error: string | null;
  profiles: LocalPlayerProfile[];
  selectedProfile: LocalPlayerProfile | null;
  companies: LocalCompany[];
  activeCompany: LocalCompany | null;
  tutorial: CompanyTutorialState;
  initialize: () => Promise<void>;
  createProfile: (displayName: string) => Promise<boolean>;
  selectProfile: (profileId: string) => Promise<void>;
  createCompany: (displayName: string, startingConditionId?: StartingConditionId) => Promise<boolean>;
  activateCompany: (companyId: string) => Promise<boolean>;
  deleteActiveCompany: () => Promise<boolean>;
  clearAllLocalData: () => Promise<boolean>;
  logout: () => Promise<void>;
  completeWelcomeTutorial: () => Promise<void>;
  reopenWelcomeTutorial: () => Promise<void>;
};

export const useCompanySessionStore = create<CompanySessionState>((set, get) => ({
  isInitialized: false,
  isSwitching: false,
  error: null,
  profiles: [],
  selectedProfile: null,
  companies: [],
  activeCompany: null,
  tutorial: DEFAULT_COMPANY_TUTORIAL_STATE,
  initialize: async () => {
    set({ isInitialized: false, error: null });
    try {
      const [profiles, persistedSession] = await Promise.all([listLocalProfiles(), loadDeviceSession()]);
      const selectedProfile = profiles.find((profile) => profile.id === persistedSession.selectedProfileId) ?? null;
      if (!selectedProfile) {
        set({ isInitialized: true, profiles, selectedProfile: null, companies: [], activeCompany: null });
        return;
      }
      const companies = await listCompaniesForProfile(selectedProfile.id);
      const activeCompany = companies.find((company) => company.id === persistedSession.activeCompanyId) ?? null;
      set({ isInitialized: true, profiles, selectedProfile, companies, activeCompany: null });
      if (activeCompany) {
        await get().activateCompany(activeCompany.id);
      }
    } catch {
      set({ isInitialized: true, error: 'Local player data could not be loaded.' });
    }
  },
  createProfile: async (displayName) => {
    const error = validateDisplayName(displayName, 'Player');
    if (error) {
      set({ error });
      return false;
    }
    const now = new Date().toISOString();
    const profile: LocalPlayerProfile = { id: createLocalId('profile'), displayName: normalizeDisplayName(displayName), createdAt: now, updatedAt: now };
    try {
      await createLocalProfile(profile);
      const profiles = await listLocalProfiles();
      await saveDeviceSession({ selectedProfileId: profile.id, activeCompanyId: null });
      set({ isInitialized: true, profiles, selectedProfile: profile, companies: [], activeCompany: null, tutorial: DEFAULT_COMPANY_TUTORIAL_STATE, error: null });
      return true;
    } catch {
      set({ error: 'The local player profile could not be created.' });
      return false;
    }
  },
  selectProfile: async (profileId) => {
    const profile = get().profiles.find((candidate) => candidate.id === profileId);
    if (!profile) return;
    const companies = await listCompaniesForProfile(profile.id);
    await saveDeviceSession({ selectedProfileId: profile.id, activeCompanyId: null });
    set({ isInitialized: true, selectedProfile: profile, companies, activeCompany: null, tutorial: DEFAULT_COMPANY_TUTORIAL_STATE, error: null });
  },
  createCompany: async (displayName, startingConditionId = 'standard') => {
    const selectedProfile = get().selectedProfile;
    const error = validateDisplayName(displayName, 'Company');
    if (error || !selectedProfile || !STARTING_CONDITIONS[startingConditionId]) {
      set({ error: error ?? 'Select a local player profile before creating a company.' });
      return false;
    }
    set({ isSwitching: true, error: null });
    try {
      const now = new Date().toISOString();
      const company: LocalCompany = {
        id: createLocalId('company'),
        ownerProfileId: selectedProfile.id,
        displayName: normalizeDisplayName(displayName),
        startingConditionId,
        createdAt: now,
        updatedAt: now,
      };
      const snapshot = createStartingGameSnapshot();
      await createCompanyWithSave({ company, snapshot });
      const companies = await listCompaniesForProfile(selectedProfile.id);
      set({ companies });
      await get().activateCompany(company.id);
      return true;
    } catch {
      set({ error: 'That company could not be created. Company names must be unique within this local profile.' });
      return false;
    } finally {
      set({ isSwitching: false });
    }
  },
  activateCompany: async (companyId) => {
    const requested = get().companies.find((company) => company.id === companyId);
    const selectedProfile = get().selectedProfile;
    if (!requested || !selectedProfile || requested.ownerProfileId !== selectedProfile.id) {
      set({ error: 'That company is not available to the selected local profile.' });
      return false;
    }
    if (get().activeCompany?.id === requested.id) return true;
    set({ isSwitching: true, error: null });
    try {
      const outgoing = get().activeCompany;
      if (outgoing) {
        useGameStore.getState().advanceRealtime(Date.now());
        await saveCompanySnapshot(outgoing.id, useGameStore.getState().createSnapshot());
      }
      const loadedSnapshot = await loadCompanySnapshot(requested.id);
      if (loadedSnapshot && isGameSnapshot(loadedSnapshot)) {
        useGameStore.getState().restoreSnapshot(loadedSnapshot);
      } else {
        const startingSnapshot = createStartingGameSnapshot();
        useGameStore.getState().restoreSnapshot(startingSnapshot);
        await saveCompanySnapshot(requested.id, startingSnapshot);
      }
      useGameStore.getState().setStartingConditionId(requested.startingConditionId);
      const tutorial = await loadCompanyTutorialState(requested.id);
      await saveDeviceSession({ selectedProfileId: selectedProfile.id, activeCompanyId: requested.id });
      set({ activeCompany: requested, tutorial, error: null });
      return true;
    } catch {
      set({ error: 'The selected company could not be opened.' });
      return false;
    } finally {
      set({ isSwitching: false });
    }
  },
  deleteActiveCompany: async () => {
    const company = get().activeCompany;
    const selectedProfile = get().selectedProfile;
    if (!company || !selectedProfile) return false;
    set({ isSwitching: true, error: null });
    try {
      await deleteCompany(company.id);
      const companies = await listCompaniesForProfile(selectedProfile.id);
      await saveDeviceSession({ selectedProfileId: selectedProfile.id, activeCompanyId: null });
      useGameStore.getState().restoreSnapshot(createStartingGameSnapshot());
      useGameStore.getState().setStartingConditionId(null);
      set({ companies, activeCompany: null, tutorial: DEFAULT_COMPANY_TUTORIAL_STATE, error: null });
      return true;
    } catch {
      set({ error: 'The active company could not be deleted.' });
      return false;
    } finally {
      set({ isSwitching: false });
    }
  },
  clearAllLocalData: async () => {
    set({ isSwitching: true, error: null });
    try {
      await clearLocalData();
      useGameStore.getState().restoreSnapshot(createStartingGameSnapshot());
      useGameStore.getState().setStartingConditionId(null);
      set({ profiles: [], selectedProfile: null, companies: [], activeCompany: null, tutorial: DEFAULT_COMPANY_TUTORIAL_STATE, error: null });
      return true;
    } catch {
      set({ error: 'All local player data could not be cleared.' });
      return false;
    } finally {
      set({ isSwitching: false });
    }
  },
  logout: async () => {
    const activeCompany = get().activeCompany;
    if (activeCompany) {
      useGameStore.getState().advanceRealtime(Date.now());
      await saveCompanySnapshot(activeCompany.id, useGameStore.getState().createSnapshot());
    }
    await saveDeviceSession(EMPTY_DEVICE_SESSION);
    useGameStore.getState().setStartingConditionId(null);
    set({ isInitialized: true, selectedProfile: null, companies: [], activeCompany: null, tutorial: DEFAULT_COMPANY_TUTORIAL_STATE, error: null });
  },
  completeWelcomeTutorial: async () => {
    const company = get().activeCompany;
    if (!company) return;
    const tutorial = { completedWelcome: true };
    await saveCompanyTutorialState(company.id, tutorial);
    set({ tutorial });
  },
  reopenWelcomeTutorial: async () => {
    const company = get().activeCompany;
    if (!company) return;
    const tutorial = { completedWelcome: false };
    await saveCompanyTutorialState(company.id, tutorial);
    set({ tutorial });
  },
}));
