export const PRESTIGE_FOREGROUND_HOUR_MS = 60 * 60 * 1_000;
export const PRESTIGE_EVENT_MIN_AMOUNT = 0.001;
export const PRESTIGE_COMPANY_BALANCE_SOURCE_ID = 'company-balance';
export const PRESTIGE_COMPANY_ASSETS_SOURCE_ID = 'company-assets';
export const PRESTIGE_FACILITY_CONDITION_SOURCE_ID = 'facility-condition';
export const PRESTIGE_SALES_HALF_LIFE_FOREGROUND_HOURS = 5;
export const PRESTIGE_FINANCE_PENALTY_HALF_LIFE_FOREGROUND_HOURS = 8;
export const PRESTIGE_CASH_WEIGHT = 0.25;
/** Soft scale for UI presentation only; prestige itself remains unbounded. */
export const PRESTIGE_PRESENTATION_SCALE = 100;
/** Sales-order prestige is logarithmic; ten points is the full green presentation range. */
export const PRESTIGE_SALES_ORDER_PRESENTATION_SCALE = 10;
export const PRESTIGE_SALES_ORDER_MINIMUM_REWARD = 100;
export const PRESTIGE_SALES_ORDER_MINIMUM_AMOUNT = 0.01;
export const PRESTIGE_SALES_ORDER_REFERENCE_REWARD = 1_000_000;
export const PRESTIGE_SALES_ORDER_REFERENCE_AMOUNT = 10;
export const PRESTIGE_ROUNDING_FACTOR = 1_000_000;
export const PRESTIGE_DECAY_PROJECTION_FOREGROUND_HOURS = [1, 2, 5, 10] as const;

export const PRESTIGE_EVENT_TYPES = [
  'company_balance',
  'company_assets',
  'facility_condition',
  'sales_order',
  'achievement',
  'finance_penalty',
] as const;
