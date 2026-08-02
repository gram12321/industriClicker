import type { ResourceType } from '../resources/resourceTypes';
import { RESOURCES, RESOURCE_TYPES } from '../resources/resourceConstants';

export const ACHIEVEMENT_CATEGORIES = [
  'facilities',
  'production',
  'sales',
  'finance',
  'time',
  'prestige',
] as const;

export type AchievementCategory = typeof ACHIEVEMENT_CATEGORIES[number];

export type AchievementMetric =
  | 'facility-count'
  | 'upgrade-levels'
  | 'resource-produced'
  | 'total-produced'
  | 'fulfilled-contract-count'
  | 'fulfilled-contract-quantity'
  | 'largest-contract-quantity'
  | 'cash-balance'
  | 'foreground-minutes'
  | 'company-prestige';

export type AchievementDefinition = {
  id: string;
  seriesId: string;
  category: AchievementCategory;
  tier: number;
  name: string;
  description: string;
  icon: string;
  metric: AchievementMetric;
  threshold: number;
  resourceType?: ResourceType;
  prestigeAmount: number;
  prestigeHalfLifeForegroundHours: number;
};

const ACHIEVEMENT_TIER_PRESTIGE = [
  { amount: 0.1, halfLifeForegroundHours: 8 },
  { amount: 0.4, halfLifeForegroundHours: 20 },
  { amount: 1.5, halfLifeForegroundHours: 50 },
] as const;

function createTieredAchievements(input: Omit<AchievementDefinition, 'id' | 'tier' | 'threshold' | 'prestigeAmount' | 'prestigeHalfLifeForegroundHours'> & { thresholds: readonly number[] }): AchievementDefinition[] {
  return input.thresholds.map((threshold, index) => ({
    id: `${input.seriesId}_tier_${index + 1}`,
    seriesId: input.seriesId,
    category: input.category,
    tier: index + 1,
    name: `${input.name} ${index + 1}`,
    description: input.description.replace('{threshold}', String(threshold)),
    icon: input.icon,
    metric: input.metric,
    threshold,
    ...(input.resourceType ? { resourceType: input.resourceType } : {}),
    prestigeAmount: ACHIEVEMENT_TIER_PRESTIGE[Math.min(index, ACHIEVEMENT_TIER_PRESTIGE.length - 1)].amount,
    prestigeHalfLifeForegroundHours: ACHIEVEMENT_TIER_PRESTIGE[Math.min(index, ACHIEVEMENT_TIER_PRESTIGE.length - 1)].halfLifeForegroundHours,
  }));
}

export function createResourceProductionAchievements(resourceType: ResourceType, resourceName: string, icon: string): AchievementDefinition[] {
  return createTieredAchievements({
    seriesId: `produced_${resourceType}`,
    category: 'production',
    name: `${resourceName} Producer`,
    description: `Produce {threshold} ${resourceName}.`,
    icon,
    metric: 'resource-produced',
    resourceType,
    thresholds: [10, 100, 1_000],
  });
}

export const ACHIEVEMENT_DEFINITIONS: readonly AchievementDefinition[] = [
  ...createTieredAchievements({ seriesId: 'facility_portfolio', category: 'facilities', name: 'Industrial Footprint', description: 'Own {threshold} facilities.', icon: 'factory', metric: 'facility-count', thresholds: [1, 3, 6] }),
  ...createTieredAchievements({ seriesId: 'facility_upgrades', category: 'facilities', name: 'Moderniser', description: 'Buy {threshold} facility upgrades.', icon: 'trending-up', metric: 'upgrade-levels', thresholds: [1, 5, 15] }),
  ...RESOURCE_TYPES.flatMap((resourceType) => createResourceProductionAchievements(resourceType, RESOURCES[resourceType].name, RESOURCES[resourceType].icon)),
  ...createTieredAchievements({ seriesId: 'total_production', category: 'production', name: 'Production Line', description: 'Complete {threshold} total output.', icon: 'package-variant', metric: 'total-produced', thresholds: [1, 100, 1_000] }),
  ...createTieredAchievements({ seriesId: 'fulfilled_contracts', category: 'sales', name: 'Contract Closer', description: 'Fulfil {threshold} customer contracts.', icon: 'handshake-outline', metric: 'fulfilled-contract-count', thresholds: [1, 10, 50] }),
  ...createTieredAchievements({ seriesId: 'fulfilled_quantity', category: 'sales', name: 'Reliable Supplier', description: 'Deliver {threshold} contract units.', icon: 'truck-delivery-outline', metric: 'fulfilled-contract-quantity', thresholds: [10, 100, 1_000] }),
  ...createTieredAchievements({ seriesId: 'largest_contract', category: 'sales', name: 'Big Deal', description: 'Fulfil one contract for {threshold} units.', icon: 'briefcase-outline', metric: 'largest-contract-quantity', thresholds: [3, 6, 10] }),
  ...createTieredAchievements({ seriesId: 'cash_reserves', category: 'finance', name: 'Cash Reserves', description: 'Hold €{threshold}.', icon: 'cash-multiple', metric: 'cash-balance', thresholds: [15_000, 25_000, 50_000] }),
  ...createTieredAchievements({ seriesId: 'company_time', category: 'time', name: 'Active Operator', description: 'Operate for {threshold} foreground minutes.', icon: 'clock-outline', metric: 'foreground-minutes', thresholds: [10, 60, 300] }),
  ...createTieredAchievements({ seriesId: 'company_prestige', category: 'prestige', name: 'Company Standing', description: 'Reach {threshold} company prestige.', icon: 'trophy-outline', metric: 'company-prestige', thresholds: [1, 5, 20] }),
];
