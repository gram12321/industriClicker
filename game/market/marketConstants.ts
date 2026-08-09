export const MARKET_DEFAULT_QUALITY = 1;
export const MARKET_DIFFUSION_DIVISOR = 1_000;
export const MARKET_DIFFUSION_CURVATURE = 0.75;
export const MARKET_DIFFUSION_MAX_EQUILIBRIUM_CORRECTION = 0.5;
export const MARKET_DIFFUSION_URGENCY_ELASTICITY = 0.2;
export const MARKET_DIFFUSION_MIN_URGENCY_MULTIPLIER = 0.75;
export const MARKET_DIFFUSION_MAX_URGENCY_MULTIPLIER = 1.5;
export const MARKET_SALES_CONTRACT_PREMIUM = 1.2;
export const MARKET_AUTOSELL_DEFAULT_MAX_PER_MINUTE = 50;
export const MARKET_AUTOSELL_INTERVAL_OPTIONS = [
  { label: 'Every 5 seconds', milliseconds: 5_000 },
  { label: 'Every 20 seconds', milliseconds: 20_000 },
  { label: 'Every minute', milliseconds: 60_000 },
  { label: 'Every 3 minutes', milliseconds: 180_000 },
  { label: 'Every 10 minutes', milliseconds: 600_000 },
] as const;
export type MarketAutoSellIntervalMs = (typeof MARKET_AUTOSELL_INTERVAL_OPTIONS)[number]['milliseconds'];
export const MARKET_AUTOSELL_DEFAULT_INTERVAL_MS: MarketAutoSellIntervalMs = 60_000;
export const MARKET_AUTOSELL_DEFAULT_MIN_KEEP = 0;
export const MARKET_AUTOSELL_DEFAULT_MIN_PRICE = 0;
export const MARKET_AUTOBUY_DEFAULT_MAX_PRICE_MULTIPLIER = 2;
