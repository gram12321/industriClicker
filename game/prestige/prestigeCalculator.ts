import type { PrestigeEvent } from './prestige';
import { FINANCE_INITIAL_BALANCE } from '@/game/company/companyConstants';
import { safeNonNegative } from '@/utils';
import { PRESTIGE_CASH_WEIGHT, PRESTIGE_EVENT_MIN_AMOUNT, PRESTIGE_DECAY_PROJECTION_FOREGROUND_HOURS, PRESTIGE_FOREGROUND_HOUR_MS, PRESTIGE_ROUNDING_FACTOR } from './prestigeConstants';

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

export function calculateSalesContractPrestige(reward: number): number {
  if (!Number.isFinite(reward) || reward <= 0) {
    return 0;
  }

  // Prestige deliberately has no fixed maximum. Finite inputs keep this logarithmic
  // formula finite; a cap adds no safety and would silently limit late-game progression.
  return roundPrestige(0.1 + 0.15 * Math.log(1 + reward));
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
    .filter((event) => event.type === 'sales_contract')
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
