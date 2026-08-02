export const PRESTIGE_FOREGROUND_HOUR_MS = 60 * 60 * 1_000;
export const PRESTIGE_EVENT_MIN_AMOUNT = 0.001;
export const PRESTIGE_COMPANY_BALANCE_SOURCE_ID = 'company-balance';
export const PRESTIGE_SALES_HALF_LIFE_FOREGROUND_HOURS = 5;
export const PRESTIGE_ROUNDING_FACTOR = 1_000_000;
export const PRESTIGE_DECAY_PROJECTION_FOREGROUND_HOURS = [1, 2, 5, 10] as const;

export const PRESTIGE_EVENT_TYPES = [
  'company_balance',
  'sales_contract',
  'achievement',
  'finance_penalty',
] as const;
