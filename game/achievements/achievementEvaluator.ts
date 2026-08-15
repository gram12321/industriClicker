import type { FacilityCollection, FacilityMaintenanceStatistics } from '@/game/facilities';
import type { Finance } from '@/game/finance';
import type { ResourceFlowLedger } from '@/game/inventory';
import type { PrestigeLedger } from '@/game/prestige';
import { calculateCompanyPrestigeSummary } from '@/game/prestige';
import type { SalesOrders } from '@/game/sales';
import { AchievementLedger } from './achievement';
import { ACHIEVEMENT_CATEGORIES, ACHIEVEMENT_DEFINITIONS, type AchievementCategory, type AchievementDefinition } from './achievementConstants';

export type AchievementEvaluationContext = {
  facilityCount: number;
  totalUpgradeLevels: number;
  repairedCondition: number;
  largestRepair: number;
  repairValueEuros: number;
  facilityEfficiencies: readonly number[];
  producedByResource: ReturnType<ResourceFlowLedger['getLifetimeFacilityOutputByResource']>;
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
  salesOrders: SalesOrders;
  prestige: PrestigeLedger;
  facilityMaintenance: FacilityMaintenanceStatistics;
  resourceFlow: ResourceFlowLedger;
  companyStartedAtGameTimeMs: number;
  currentGameTimeMs: number;
}): AchievementEvaluationContext {
  const fulfilledContracts = input.salesOrders.getCompletedOrders().filter((order) => order.status === 'fulfilled');
  const facilityList = input.facilities.getAll();

  return {
    facilityCount: facilityList.length,
    totalUpgradeLevels: facilityList.reduce((total, facility) => {
      const facilityView = facility.getView();
      return total + facilityView.speedUpgradeLevel + facilityView.outputUpgradeLevel + facilityView.conditionDecayUpgradeLevel;
    }, 0),
    repairedCondition: input.facilityMaintenance.getRepairedCondition(),
    largestRepair: input.facilityMaintenance.getLargestRepair(),
    repairValueEuros: input.facilityMaintenance.getRepairValueEuros(),
    facilityEfficiencies: facilityList.map((facility) => facility.getView().facilityEfficiency),
    producedByResource: input.resourceFlow.getLifetimeFacilityOutputByResource(),
    totalProduced: input.resourceFlow.getTotalLifetimeFacilityOutput(),
    fulfilledContractCount: fulfilledContracts.length,
    fulfilledContractQuantity: fulfilledContracts.reduce((total, contract) => total + contract.lines.reduce((lineTotal, line) => lineTotal + line.quantity, 0), 0),
    largestFulfilledContractQuantity: fulfilledContracts.reduce((largest, contract) => Math.max(largest, contract.lines.reduce((lineTotal, line) => lineTotal + line.quantity, 0)), 0),
    cashBalance: input.finance.getBalance(),
    foregroundMinutes: Math.max(0, input.currentGameTimeMs - input.companyStartedAtGameTimeMs) / 60_000,
    companyPrestige: calculateCompanyPrestigeSummary(input.prestige.getEvents(), input.currentGameTimeMs).totalPrestige,
  };
}

export function getAchievementCurrentValue(definition: AchievementDefinition, context: AchievementEvaluationContext): number {
  switch (definition.metric) {
    case 'facility-count': return context.facilityCount;
    case 'upgrade-levels': return context.totalUpgradeLevels;
    case 'facility-upgrade-depth': return Math.min(context.facilityCount, Math.floor(context.totalUpgradeLevels / 6));
    case 'condition-repaired': return context.repairedCondition * 100;
    case 'largest-repair': return context.largestRepair * 100;
    case 'repair-value-euros': return context.repairValueEuros;
    case 'facility-efficiency-count': return context.facilityEfficiencies.filter((efficiency) => efficiency >= (definition.facilityEfficiencyThreshold ?? Infinity)).length;
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
