/** Shared display and small math helpers. Kept free of React Native and game-domain dependencies. */
export const DISPLAY_LOCALE = 'da-DK';
export const DISPLAY_CURRENCY = 'EUR';

export const ACHIEVEMENT_MASTERY_NAMES = [
  'First Shift',
  'Factory Hand',
  'Industrial Veteran',
  'Plant Supervisor',
  'Industry Legend',
  'Process Pioneer',
  'Production Architect',
  'Titan of Industry',
  'Industrial Icon',
  'Legacy Builder',
] as const;

export function getAchievementMasteryName(tier: number): string {
  const index = Math.max(0, Math.min(ACHIEVEMENT_MASTERY_NAMES.length - 1, Math.floor(tier) - 1));
  return ACHIEVEMENT_MASTERY_NAMES[index];
}

export interface NumberFormatOptions {
  decimals?: number;
  forceDecimals?: boolean;
  smartDecimals?: boolean;
  smartMaxDecimals?: boolean;
  adaptiveNearOne?: boolean;
  compact?: boolean;
  currency?: boolean;
  percent?: boolean;
  percentIsDecimal?: boolean;
}

export interface CurrencyFormatOptions {
  decimals?: number;
  minimumFractionDigits?: number;
  showSign?: boolean;
}

export interface CompactFormatOptions {
  decimals?: number;
  currency?: boolean;
}

export interface PercentFormatOptions {
  decimals?: number;
  forceDecimals?: boolean;
  input?: 'decimal' | 'percent';
}

const COMPACT_UNITS = [
  { threshold: 1e12, suffix: 'T' },
  { threshold: 1e9, suffix: 'B' },
  { threshold: 1e6, suffix: 'M' },
  { threshold: 1e3, suffix: 'K' },
] as const;

const RATING_COLORS = [
  '#B3261E',
  '#D32F2F',
  '#ED6C02',
  '#F9A825',
  '#FBC02D',
  '#7CB342',
  '#558B2F',
  '#388E3C',
  '#2E7D32',
  '#1B5E20',
] as const;

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export function safeNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function randomInRange(minimum: number, maximum: number): number {
  return minimum + Math.random() * (maximum - minimum);
}

export function randomInt(minimum: number, maximum: number): number {
  return Math.floor(randomInRange(minimum, maximum + 1));
}

export function getRandomFromArray<T>(values: readonly T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}

export function formatNumber(value: number, options: NumberFormatOptions = {}): string {
  const {
    decimals,
    forceDecimals = false,
    smartDecimals = false,
    smartMaxDecimals = false,
    adaptiveNearOne = true,
    compact = false,
    currency = false,
    percent = false,
    percentIsDecimal = true,
  } = options;

  if (!Number.isFinite(value)) {
    return currency ? formatCurrency(0) : '0';
  }

  if (percent) {
    return formatPercent(value, {
      decimals: decimals ?? 1,
      forceDecimals,
      input: percentIsDecimal ? 'decimal' : 'percent',
    });
  }

  if (compact) {
    return formatCompact(value, { decimals, currency });
  }

  if (currency) {
    return formatCurrency(value, { decimals });
  }

  let fractionDigits = decimals ?? 2;
  const absoluteValue = Math.abs(value);

  if (smartMaxDecimals) {
    fractionDigits = absoluteValue >= 10 ? 0 : absoluteValue >= 1 ? 1 : 2;
  }

  if (adaptiveNearOne && absoluteValue < 1 && absoluteValue >= 0.95) {
    fractionDigits = Math.max(fractionDigits, absoluteValue >= 0.98 ? 5 : 4);
  }

  if (smartDecimals) {
    fractionDigits = getSmartFractionDigits(absoluteValue, fractionDigits, adaptiveNearOne);
  }

  if (!forceDecimals && !smartDecimals && (absoluteValue >= 1000 || Number.isInteger(value))) {
    return new Intl.NumberFormat(DISPLAY_LOCALE, { maximumFractionDigits: 0 }).format(value);
  }

  return new Intl.NumberFormat(DISPLAY_LOCALE, {
    minimumFractionDigits: forceDecimals || !smartDecimals ? fractionDigits : 0,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatCurrency(value: number, options: CurrencyFormatOptions = {}): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  const decimals = Math.max(0, options.decimals ?? 2);
  const minimumFractionDigits = Math.max(0, Math.min(options.minimumFractionDigits ?? 0, decimals));

  return new Intl.NumberFormat(DISPLAY_LOCALE, {
    style: 'currency',
    currency: DISPLAY_CURRENCY,
    minimumFractionDigits,
    maximumFractionDigits: decimals,
    signDisplay: options.showSign ? 'always' : 'auto',
  }).format(safeValue);
}

export function formatCompact(value: number, options: CompactFormatOptions = {}): string {
  if (!Number.isFinite(value)) {
    return options.currency ? formatCurrency(0) : '0';
  }

  const unit = COMPACT_UNITS.find(({ threshold }) => Math.abs(value) >= threshold);
  if (!unit) {
    return options.currency
      ? formatCurrency(value, { decimals: options.decimals ?? 1 })
      : formatNumber(value, { decimals: options.decimals ?? 1, smartDecimals: true });
  }

  const compactValue = formatNumber(value / unit.threshold, {
    decimals: options.decimals ?? 1,
    smartDecimals: true,
    adaptiveNearOne: false,
  });
  const formatted = `${compactValue}${unit.suffix}`;
  return options.currency ? `${formatted}\u00A0\u20AC` : formatted;
}

export function formatPercent(value: number, options: PercentFormatOptions = {}): string {
  if (!Number.isFinite(value)) return '0%';

  const decimals = Math.max(0, options.decimals ?? 1);
  const decimalValue = (options.input ?? 'decimal') === 'decimal' ? value : value / 100;

  return new Intl.NumberFormat(DISPLAY_LOCALE, {
    style: 'percent',
    minimumFractionDigits: options.forceDecimals ? decimals : 0,
    maximumFractionDigits: decimals,
  }).format(decimalValue);
}

export function formatSigned(value: number, options: Omit<NumberFormatOptions, 'currency' | 'percent'> = {}): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${safeValue >= 0 ? '+' : ''}${formatNumber(safeValue, { smartDecimals: true, ...options })}`;
}

export function formatSignedPercent(value: number, options: PercentFormatOptions = {}): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${safeValue >= 0 ? '+' : ''}${formatPercent(safeValue, options)}`;
}

export function formatDate(date: Date, includeTime = false): string {
  if (Number.isNaN(date.getTime())) return 'Ugyldig dato';

  return new Intl.DateTimeFormat(DISPLAY_LOCALE, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
}

export function formatTime(date: Date): string {
  if (Number.isNaN(date.getTime())) return 'Ugyldig tid';

  return new Intl.DateTimeFormat(DISPLAY_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '0 min';

  if (minutes < 1) {
    return `${formatNumber(minutes * 60, { smartDecimals: true })} sec`;
  }

  if (minutes < 60) {
    return `${formatNumber(minutes, { smartDecimals: true })} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const formattedHours = formatNumber(hours, { smartDecimals: true });

  return remainingMinutes === 0
    ? `${formattedHours} h`
    : `${formattedHours} h ${formatNumber(remainingMinutes, { smartDecimals: true })} min`;
}

/** Formats logical foreground time compactly for persistent header display. */
export function formatElapsedTime(milliseconds: number): string {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return '0:00';

  const totalSeconds = Math.floor(milliseconds / 1_000);
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor(totalSeconds % 3_600 / 60);
  const seconds = totalSeconds % 60;
  const minuteAndSecond = `${String(minutes).padStart(hours > 0 ? 2 : 1, '0')}:${String(seconds).padStart(2, '0')}`;
  return hours > 0 ? `${hours}:${minuteAndSecond}` : minuteAndSecond;
}

/** Returns a React Native-ready hex color for a normalized 0-1 rating. */
export function getColorClass(value: number): string {
  if (!Number.isFinite(value)) return '#61716B';
  const index = Math.min(RATING_COLORS.length - 1, Math.floor(clamp01(value) * RATING_COLORS.length));
  return RATING_COLORS[index];
}

function getSmartFractionDigits(absoluteValue: number, defaultDigits: number, adaptiveNearOne: boolean): number {
  if (absoluteValue === 0) return 0;
  if (absoluteValue >= 1) return Math.min(defaultDigits, 6);
  if (adaptiveNearOne && absoluteValue >= 0.95) return absoluteValue >= 0.98 ? 5 : 4;

  return Math.min(Math.max(Math.ceil(-Math.log10(absoluteValue)) + 1, 2), 6);
}
