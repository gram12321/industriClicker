import type { PrestigeEvent } from './prestige';
import { INITIAL_BALANCE } from '@/game/finance/finance';
import { safeNonNegative } from '@/utils';
import {
  PRESTIGE_EVENT_MIN_AMOUNT,
  PRESTIGE_DECAY_PROJECTION_FOREGROUND_HOURS,
  PRESTIGE_FOREGROUND_HOUR_MS,
  PRESTIGE_ROUNDING_FACTOR,
  PRESTIGE_SALES_MAX_AMOUNT,
} from './prestigeConstants';

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
  salesPrestige: number;
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
  const companyCapital = safeNonNegative(input.cashBalance)
    + safeNonNegative(input.assetBookValue ?? 0)
    - safeNonNegative(input.liabilities ?? 0);

  return roundPrestige(Math.log(1 + Math.max(0, companyCapital) / INITIAL_BALANCE));
}

export function calculateSalesContractPrestige(reward: number): number {
  if (!Number.isFinite(reward) || reward <= 0) {
    return 0;
  }

  return roundPrestige(Math.min(
    PRESTIGE_SALES_MAX_AMOUNT,
    0.1 + 0.15 * Math.log(1 + reward),
  ));
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
  const salesPrestige = currentEvents
    .filter((event) => event.type === 'sales_contract')
    .reduce((sum, event) => sum + event.currentAmount, 0);

  return {
    totalPrestige: roundPrestige(currentEvents.reduce((sum, event) => sum + event.currentAmount, 0)),
    balancePrestige: roundPrestige(balancePrestige),
    salesPrestige: roundPrestige(salesPrestige),
    events: currentEvents,
  };
}
