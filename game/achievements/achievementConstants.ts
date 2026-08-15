import { RESOURCES, RESOURCE_TYPES, ResourceType } from '@/game/resources';

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
  | 'facility-upgrade-depth'
  | 'condition-repaired'
  | 'largest-repair'
  | 'repair-value-euros'
  | 'facility-efficiency-count'
  | 'resource-produced'
  | 'total-produced'
  | 'fulfilled-order-count'
  | 'fulfilled-order-quantity'
  | 'largest-order-quantity'
  | 'trusted-customer-count'
  | 'fulfilled-order-ratio'
  | 'high-premium-order-count'
  | 'largest-bundle-line-count'
  | 'fulfilled-order-domain-count'
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
  facilityEfficiencyThreshold?: number;
  minimumCompletedOrderCount?: number;
  prestigeAmount: number;
  prestigeHalfLifeForegroundHours: number;
  rewards?: readonly AchievementReward[];
};

export type AchievementReward = { resourceType: ResourceType; amount: number };

const ACHIEVEMENT_TIER_PRESTIGE = [
  { amount: 0.1, halfLifeForegroundHours: 8 },
  { amount: 0.4, halfLifeForegroundHours: 20 },
  { amount: 1.5, halfLifeForegroundHours: 50 },
] as const;

function createTieredAchievements(input: Omit<AchievementDefinition, 'id' | 'tier' | 'threshold' | 'prestigeAmount' | 'prestigeHalfLifeForegroundHours'> & { thresholds: readonly number[]; prestigeAmounts?: readonly number[] }): AchievementDefinition[] {
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
    prestigeAmount: input.prestigeAmounts?.[index] ?? ACHIEVEMENT_TIER_PRESTIGE[Math.min(index, ACHIEVEMENT_TIER_PRESTIGE.length - 1)].amount,
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
    thresholds: [10, 100, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000],
  });
}

export const ACHIEVEMENT_DEFINITIONS: readonly AchievementDefinition[] = [
  ...createTieredAchievements({ seriesId: 'facility_portfolio', category: 'facilities', name: 'Industrial Footprint', description: 'Own {threshold} facilities.', icon: 'factory', metric: 'facility-count', thresholds: [1, 3, 6, 10, 15] }).map((achievement, index) => index === 0 ? { ...achievement, description: 'Own your first facility. Receive 10 Water and 10 Electricity.', rewards: [{ resourceType: ResourceType.Water, amount: 10 }, { resourceType: ResourceType.Electricity, amount: 10 }] } : achievement),
  ...createTieredAchievements({ seriesId: 'facility_upgrades', category: 'facilities', name: 'Moderniser', description: 'Buy {threshold} facility upgrades.', icon: 'trending-up', metric: 'upgrade-levels', thresholds: [1, 5, 15, 30, 60] }),
  ...createTieredAchievements({ seriesId: 'facility_upgrade_depth', category: 'facilities', name: 'Integrated Industry', description: 'Have {threshold} facilities and at least 6 upgrades per facility.', icon: 'factory-cog', metric: 'facility-upgrade-depth', thresholds: [1, 2, 3, 4, 5], prestigeAmounts: [0.3, 1.2, 4.5, 8, 12] }),
  ...createTieredAchievements({ seriesId: 'condition_repaired', category: 'facilities', name: 'Restoration Works', description: 'Restore {threshold}% facility condition.', icon: 'wrench', metric: 'condition-repaired', thresholds: [10, 50, 100, 250, 500] }),
  ...createTieredAchievements({ seriesId: 'largest_repair', category: 'facilities', name: 'Major Overhaul', description: 'Restore {threshold}% condition in one repair.', icon: 'tools', metric: 'largest-repair', thresholds: [10, 25, 50, 75, 100] }),
  ...createTieredAchievements({ seriesId: 'repair_value_euros', category: 'facilities', name: 'Maintenance Budget', description: 'Spend €{threshold} on repairs.', icon: 'cash-wrench', metric: 'repair-value-euros', thresholds: [100, 500, 1_000, 5_000, 10_000] }),
  ...[
    { tier: 1, count: 1, efficiency: 0.5 }, { tier: 2, count: 3, efficiency: 0.75 }, { tier: 3, count: 6, efficiency: 0.9 }, { tier: 4, count: 10, efficiency: 1 }, { tier: 5, count: 15, efficiency: 1.1 },
  ].map(({ tier, count, efficiency }) => ({ id: `facility_efficiency_tier_${tier}`, seriesId: 'facility_efficiency', category: 'facilities' as const, tier, name: `Operational Excellence ${tier}`, description: `Have ${count} facilities at ${Math.round(efficiency * 100)}% efficiency or higher at once.`, icon: 'gauge', metric: 'facility-efficiency-count' as const, threshold: count, facilityEfficiencyThreshold: efficiency, prestigeAmount: ACHIEVEMENT_TIER_PRESTIGE[Math.min(tier - 1, ACHIEVEMENT_TIER_PRESTIGE.length - 1)].amount, prestigeHalfLifeForegroundHours: ACHIEVEMENT_TIER_PRESTIGE[Math.min(tier - 1, ACHIEVEMENT_TIER_PRESTIGE.length - 1)].halfLifeForegroundHours })),
  ...RESOURCE_TYPES.flatMap((resourceType) => createResourceProductionAchievements(resourceType, RESOURCES[resourceType].name, RESOURCES[resourceType].icon)),
  ...createTieredAchievements({ seriesId: 'total_production', category: 'production', name: 'Production Line', description: 'Complete {threshold} total output.', icon: 'package-variant', metric: 'total-produced', thresholds: [1, 100, 1_000] }),
  ...createTieredAchievements({ seriesId: 'fulfilled_orders', category: 'sales', name: 'Order Closer', description: 'Fulfil {threshold} customer orders.', icon: 'handshake-outline', metric: 'fulfilled-order-count', thresholds: [1, 10, 50] }),
  ...createTieredAchievements({ seriesId: 'fulfilled_quantity', category: 'sales', name: 'Reliable Supplier', description: 'Deliver {threshold} order units.', icon: 'truck-delivery-outline', metric: 'fulfilled-order-quantity', thresholds: [10, 100, 1_000] }),
  ...createTieredAchievements({ seriesId: 'largest_order', category: 'sales', name: 'Big Deal', description: 'Fulfil one order for {threshold} units.', icon: 'briefcase-outline', metric: 'largest-order-quantity', thresholds: [3, 6, 10] }),
  ...createTieredAchievements({ seriesId: 'trusted_customers', category: 'sales', name: 'Trusted Portfolio', description: 'Keep {threshold} customers at 60+ relationship.', icon: 'account-group-outline', metric: 'trusted-customer-count', thresholds: [1, 3, 6] }),
  ...createTieredAchievements({ seriesId: 'sales_reliability', category: 'sales', name: 'Reliability Index', description: 'Keep fulfilled-order reliability above {threshold}%.', icon: 'shield-check-outline', metric: 'fulfilled-order-ratio', thresholds: [60, 75, 85] }).map((achievement) => ({ ...achievement, minimumCompletedOrderCount: 10 })),
  ...createTieredAchievements({ seriesId: 'premium_orders', category: 'sales', name: 'Premium Negotiator', description: 'Fulfil {threshold} orders above +10% premium.', icon: 'cash-plus', metric: 'high-premium-order-count', thresholds: [1, 10, 50] }),
  ...createTieredAchievements({ seriesId: 'bundle_maturity', category: 'sales', name: 'Bundle Specialist', description: 'Fulfil one order with {threshold} lines.', icon: 'package-variant-closed-plus', metric: 'largest-bundle-line-count', thresholds: [2, 3, 4] }),
  ...createTieredAchievements({ seriesId: 'domain_reach', category: 'sales', name: 'Domain Reach', description: 'Fulfil orders in {threshold} sales domains.', icon: 'earth', metric: 'fulfilled-order-domain-count', thresholds: [2, 4, 6] }),
  ...createTieredAchievements({ seriesId: 'cash_reserves', category: 'finance', name: 'Cash Reserves', description: 'Hold €{threshold}.', icon: 'cash-multiple', metric: 'cash-balance', thresholds: [15_000, 25_000, 50_000] }),
  ...createTieredAchievements({ seriesId: 'company_time', category: 'time', name: 'Active Operator', description: 'Operate for {threshold} foreground minutes.', icon: 'clock-outline', metric: 'foreground-minutes', thresholds: [10, 60, 300] }),
  ...createTieredAchievements({ seriesId: 'company_prestige', category: 'prestige', name: 'Company Standing', description: 'Reach {threshold} company prestige.', icon: 'trophy-outline', metric: 'company-prestige', thresholds: [1, 5, 20] }),
];
