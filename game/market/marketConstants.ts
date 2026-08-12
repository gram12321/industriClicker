export const MARKET_DEFAULT_QUALITY = 1;
export const MARKET_DIFFUSION_DIVISOR = 1_000;
export const MARKET_DIFFUSION_CURVATURE = 0.75;
export const MARKET_DIFFUSION_MAX_EQUILIBRIUM_CORRECTION = 0.5;
/** The reference duration used by diffusion's per-minute balance values. */
export const MARKET_DIFFUSION_REFERENCE_INTERVAL_MS = 60_000;
/** Foreground cadence for applying market-pool diffusion. */
export const MARKET_DIFFUSION_INTERVAL_MS = 5_000;
export const MARKET_SALES_CONTRACT_PREMIUM = 1.2;
export const MARKET_AUTOSELL_DEFAULT_MAX_PER_MINUTE = 50;
export const MARKET_AUTOTRADE_INTERVAL_OPTIONS = [
  { label: 'Every 5 seconds', milliseconds: 5_000 },
  { label: 'Every 20 seconds', milliseconds: 20_000 },
  { label: 'Every minute', milliseconds: 60_000 },
  { label: 'Every 3 minutes', milliseconds: 180_000 },
  { label: 'Every 10 minutes', milliseconds: 600_000 },
] as const;
export type MarketAutoTradeIntervalMs = (typeof MARKET_AUTOTRADE_INTERVAL_OPTIONS)[number]['milliseconds'];
export const MARKET_AUTOTRADE_DEFAULT_INTERVAL_MS: MarketAutoTradeIntervalMs = 5_000;
export const MARKET_AUTOSELL_DEFAULT_MIN_KEEP = 0;
export const MARKET_AUTOSELL_DEFAULT_MIN_PRICE = 0;
export const MARKET_AUTOBUY_DEFAULT_MAX_PRICE_MULTIPLIER = 2;
export const MARKET_AUTOBUY_DEFAULT_TARGET_INVENTORY = 0;
