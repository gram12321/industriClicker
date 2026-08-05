export const STARTING_CONDITION_IDS = ['standard'] as const;
export type StartingConditionId = (typeof STARTING_CONDITION_IDS)[number];

export type LocalPlayerProfile = {
  id: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
};

export type LocalCompany = {
  id: string;
  ownerProfileId: string;
  displayName: string;
  startingConditionId: StartingConditionId;
  createdAt: string;
  updatedAt: string;
};

export type CompanyTutorialState = { completedWelcome: boolean };

export type DeviceSession = {
  selectedProfileId: string | null;
  activeCompanyId: string | null;
};

export const DEFAULT_COMPANY_TUTORIAL_STATE: CompanyTutorialState = { completedWelcome: true };
export const EMPTY_DEVICE_SESSION: DeviceSession = { selectedProfileId: null, activeCompanyId: null };

const MAX_DISPLAY_NAME_LENGTH = 32;

export function normalizeDisplayName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function validateDisplayName(value: string, label: string): string | null {
  const normalized = normalizeDisplayName(value);
  if (!normalized) return `${label} name is required.`;
  if (normalized.length > MAX_DISPLAY_NAME_LENGTH) return `${label} name must be ${MAX_DISPLAY_NAME_LENGTH} characters or fewer.`;
  return null;
}

export function createLocalId(prefix: 'company' | 'profile'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
