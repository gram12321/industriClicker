import type { FacilityCollection } from '@/game/facilities';
import type { Finance } from '@/game/finance';
import type { PrestigeLedger } from '@/game/prestige';
import { calculateCompanyPrestigeSummary } from '@/game/prestige';
import type { SalesContracts } from '@/game/sales';
import { AchievementLedger } from './achievement';
import { ACHIEVEMENT_CATEGORIES, ACHIEVEMENT_DEFINITIONS, type AchievementCategory, type AchievementDefinition } from './achievementConstants';
import type { ProductionStatistics } from './productionStatistics';

export type AchievementEvaluationContext = {
  facilityCount: number;
  totalUpgradeLevels: number;
  producedByResource: ReturnType<ProductionStatistics['toSnapshot']>['producedByResource'];
  totalProduced: number;
  fulfilledContractCount: number;
  fulfilledContractQuantity: number;
  largestFulfilledContractQuantity: number;
  cashBalance: number;
  foregroundMinutes: number;
  companyPrestige: number;
};

export type AchievementDisplay = AchievementDefinition & {
  currentValue: number;
  isUnlocked: boolean;
  unlockedAtGameTimeMs: number | null;
};

export function createAchievementEvaluationContext(input: {
  facilities: FacilityCollection;
  finance: Finance;
  salesContracts: SalesContracts;
  prestige: PrestigeLedger;
  productionStatistics: ProductionStatistics;
  companyStartedAtGameTimeMs: number;
  currentGameTimeMs: number;
}): AchievementEvaluationContext {
  const fulfilledContracts = input.salesContracts.getCompletedContracts().filter((contract) => contract.status === 'fulfilled');
  const facilityList = input.facilities.getAll();

  return {
    facilityCount: facilityList.length,
    totalUpgradeLevels: facilityList.reduce((total, facility) => {
      const facilityView = facility.getView();
      return total + facilityView.speedUpgradeLevel + facilityView.outputUpgradeLevel;
    }, 0),
    producedByResource: input.productionStatistics.toSnapshot().producedByResource,
    totalProduced: input.productionStatistics.getTotalProduced(),
    fulfilledContractCount: fulfilledContracts.length,
    fulfilledContractQuantity: fulfilledContracts.reduce((total, contract) => total + contract.quantity, 0),
    largestFulfilledContractQuantity: fulfilledContracts.reduce((largest, contract) => Math.max(largest, contract.quantity), 0),
    cashBalance: input.finance.getBalance(),
    foregroundMinutes: Math.max(0, input.currentGameTimeMs - input.companyStartedAtGameTimeMs) / 60_000,
    companyPrestige: calculateCompanyPrestigeSummary(input.prestige.getEvents(), input.currentGameTimeMs).totalPrestige,
  };
}

export function getAchievementCurrentValue(definition: AchievementDefinition, context: AchievementEvaluationContext): number {
  switch (definition.metric) {
    case 'facility-count': return context.facilityCount;
    case 'upgrade-levels': return context.totalUpgradeLevels;
    case 'resource-produced': return definition.resourceType ? context.producedByResource[definition.resourceType] : 0;
    case 'total-produced': return context.totalProduced;
    case 'fulfilled-contract-count': return context.fulfilledContractCount;
    case 'fulfilled-contract-quantity': return context.fulfilledContractQuantity;
    case 'largest-contract-quantity': return context.largestFulfilledContractQuantity;
    case 'cash-balance': return context.cashBalance;
    case 'foreground-minutes': return context.foregroundMinutes;
    case 'company-prestige': return context.companyPrestige;
  }
}

export function evaluateAchievementUnlocks(
  context: AchievementEvaluationContext,
  ledger: AchievementLedger,
  categories: readonly AchievementCategory[] = ACHIEVEMENT_CATEGORIES,
): AchievementDefinition[] {
  return ACHIEVEMENT_DEFINITIONS.filter((definition) => (
    categories.includes(definition.category)
    && !ledger.hasUnlocked(definition.id)
    && getAchievementCurrentValue(definition, context) >= definition.threshold
  ));
}

export function getAchievementDisplay(context: AchievementEvaluationContext, ledger: AchievementLedger): AchievementDisplay[] {
  return ACHIEVEMENT_DEFINITIONS.map((definition) => {
    const unlock = ledger.getUnlock(definition.id);
    return {
      ...definition,
      currentValue: getAchievementCurrentValue(definition, context),
      isUnlocked: unlock !== null,
      unlockedAtGameTimeMs: unlock?.unlockedAtGameTimeMs ?? null,
    };
  });
}

/** Shows the next incomplete tier, or the final earned tier once a series is complete. */
export function filterAchievementSeriesForDisplay(achievements: readonly AchievementDisplay[]): AchievementDisplay[] {
  const bySeries = new Map<string, AchievementDisplay[]>();

  for (const achievement of achievements) {
    const series = bySeries.get(achievement.seriesId) ?? [];
    series.push(achievement);
    bySeries.set(achievement.seriesId, series);
  }

  return [...bySeries.values()].flatMap((series) => {
    const sorted = [...series].sort((left, right) => left.tier - right.tier);
    return [sorted.find((achievement) => !achievement.isUnlocked) ?? sorted[sorted.length - 1]];
  });
}
