import type { PrestigeEvent } from './prestige';
import { FINANCE_INITIAL_BALANCE } from '@/game/company/companyConstants';
import { safeNonNegative } from '@/utils';
import { PRESTIGE_CASH_WEIGHT, PRESTIGE_EVENT_MIN_AMOUNT, PRESTIGE_DECAY_PROJECTION_FOREGROUND_HOURS, PRESTIGE_FOREGROUND_HOUR_MS, PRESTIGE_PRESENTATION_SCALE, PRESTIGE_ROUNDING_FACTOR, PRESTIGE_SALES_ORDER_MINIMUM_AMOUNT, PRESTIGE_SALES_ORDER_MINIMUM_REWARD, PRESTIGE_SALES_ORDER_REFERENCE_AMOUNT, PRESTIGE_SALES_ORDER_REFERENCE_REWARD } from './prestigeConstants';

type CompanyCapitalInput = {
  cashBalance: number;
  assetBookValue?: number;
  liabilities?: number;
};

export type CurrentPrestigeEvent = PrestigeEvent & {
  currentAmount: number;
};

export type CompanyPrestigeSummary = {
  totalPrestige: number;
  balancePrestige: number;
  assetsPrestige: number;
  facilityConditionPrestige: number;
  salesPrestige: number;
  achievementPrestige: number;
  events: CurrentPrestigeEvent[];
};

export type PrestigeDecayDetails = {
  originalAmount: number;
  currentAmount: number;
  decayPerForegroundHourPercent: number | null;
  halfLifeForegroundHours: number | null;
  projections: Array<{ foregroundHoursFromNow: number; amount: number }>;
};

function roundPrestige(value: number): number {
  return Math.round(value * PRESTIGE_ROUNDING_FACTOR) / PRESTIGE_ROUNDING_FACTOR;
}

export function calculateCompanyBalancePrestige(input: CompanyCapitalInput): number {
  return roundPrestige(PRESTIGE_CASH_WEIGHT * Math.log(1 + safeNonNegative(input.cashBalance) / FINANCE_INITIAL_BALANCE));
}

export function calculateCompanyAssetsPrestige(input: Pick<CompanyCapitalInput, 'assetBookValue' | 'liabilities'>): number {
  const netWorth = safeNonNegative(input.assetBookValue ?? 0) - safeNonNegative(input.liabilities ?? 0);
  return roundPrestige(Math.log(1 + Math.max(0, netWorth) / FINANCE_INITIAL_BALANCE));
}

export function calculateSalesOrderPrestige(reward: number, _premiumPercent = 0): number {
  if (!Number.isFinite(reward) || reward <= 0) {
    return 0;
  }

  // Order prestige is anchored to the smallest configured offer and a €1m reference
  // order. It remains unbounded above the reference because company assets and order
  // caps have no global ceiling.
  const rewardRatio = Math.log10(Math.max(PRESTIGE_SALES_ORDER_MINIMUM_REWARD, reward) / PRESTIGE_SALES_ORDER_MINIMUM_REWARD);
  const referenceRatio = Math.log10(PRESTIGE_SALES_ORDER_REFERENCE_REWARD / PRESTIGE_SALES_ORDER_MINIMUM_REWARD);
  return roundPrestige(PRESTIGE_SALES_ORDER_MINIMUM_AMOUNT + (PRESTIGE_SALES_ORDER_REFERENCE_AMOUNT - PRESTIGE_SALES_ORDER_MINIMUM_AMOUNT) * rewardRatio / referenceRatio);
}

/** Maps unbounded positive prestige to a monotonic 0–1 presentation score. */
export function normalizeCompanyPrestigeForPresentation(prestige: number): number {
  const safePrestige = safeNonNegative(prestige);
  return safePrestige / (safePrestige + PRESTIGE_PRESENTATION_SCALE);
}

/** Temporary equal-weight facility model; use total facility asset value when that metric exists. */
export function calculateFacilityConditionPrestige(conditions: readonly number[]): number {
  if (conditions.length === 0) return 0;
  const averageCondition = conditions.reduce((sum, condition) => sum + Math.min(1, Math.max(0, condition)), 0) / conditions.length;
  return roundPrestige((averageCondition - 0.5) * conditions.length);
}

export function calculateCurrentPrestigeAmount(event: PrestigeEvent, currentGameTimeMs: number): number {
  if (event.decayHalfLifeForegroundHours === null || !Number.isFinite(currentGameTimeMs)) {
    return event.amountBase;
  }

  const elapsedForegroundHours = Math.max(0, currentGameTimeMs - event.createdAtGameTimeMs) / PRESTIGE_FOREGROUND_HOUR_MS;
  return roundPrestige(event.amountBase * Math.pow(0.5, elapsedForegroundHours / event.decayHalfLifeForegroundHours));
}

export function calculatePrestigeDecayDetails(
  event: PrestigeEvent,
  currentGameTimeMs: number,
): PrestigeDecayDetails {
  if (event.decayHalfLifeForegroundHours === null) {
    return {
      originalAmount: event.amountBase,
      currentAmount: event.amountBase,
      decayPerForegroundHourPercent: null,
      halfLifeForegroundHours: null,
      projections: [],
    };
  }

  const currentAmount = calculateCurrentPrestigeAmount(event, currentGameTimeMs);
  const hourlyRetention = Math.pow(0.5, 1 / event.decayHalfLifeForegroundHours);

  return {
    originalAmount: event.amountBase,
    currentAmount,
    decayPerForegroundHourPercent: roundPrestige((1 - hourlyRetention) * 100),
    halfLifeForegroundHours: event.decayHalfLifeForegroundHours,
    projections: PRESTIGE_DECAY_PROJECTION_FOREGROUND_HOURS.map((foregroundHoursFromNow) => ({
      foregroundHoursFromNow,
      amount: calculateCurrentPrestigeAmount(
        event,
        currentGameTimeMs + foregroundHoursFromNow * PRESTIGE_FOREGROUND_HOUR_MS,
      ),
    })),
  };
}

export function calculateCompanyPrestigeSummary(
  events: readonly PrestigeEvent[],
  currentGameTimeMs: number,
): CompanyPrestigeSummary {
  const currentEvents = events
    .map((event) => ({ ...event, currentAmount: calculateCurrentPrestigeAmount(event, currentGameTimeMs) }))
    .filter((event) => Math.abs(event.currentAmount) >= PRESTIGE_EVENT_MIN_AMOUNT);
  const balancePrestige = currentEvents
    .filter((event) => event.type === 'company_balance')
    .reduce((sum, event) => sum + event.currentAmount, 0);
  const assetsPrestige = currentEvents.filter((event) => event.type === 'company_assets').reduce((sum, event) => sum + event.currentAmount, 0);
  const facilityConditionPrestige = currentEvents.filter((event) => event.type === 'facility_condition').reduce((sum, event) => sum + event.currentAmount, 0);
  const salesPrestige = currentEvents
    .filter((event) => event.type === 'sales_order')
    .reduce((sum, event) => sum + event.currentAmount, 0);
  const achievementPrestige = currentEvents
    .filter((event) => event.type === 'achievement')
    .reduce((sum, event) => sum + event.currentAmount, 0);

  return {
    totalPrestige: roundPrestige(currentEvents.reduce((sum, event) => sum + event.currentAmount, 0)),
    balancePrestige: roundPrestige(balancePrestige),
    assetsPrestige: roundPrestige(assetsPrestige),
    facilityConditionPrestige: roundPrestige(facilityConditionPrestige),
    salesPrestige: roundPrestige(salesPrestige),
    achievementPrestige: roundPrestige(achievementPrestige),
    events: currentEvents,
  };
}
