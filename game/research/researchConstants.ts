import type { GateRequirement } from '@/game/gates';
import { FACILITIES } from '@/game/facilities';
import { getRecipeDisplayName, RecipeName } from '@/game/recipes';
import { RESOURCE_TYPES, getResource, type ResourceType } from '@/game/resources';
import { scaleExponential } from '@/game/core/math/scaling';
import { calculateResearchMaxQ, RESOURCE_QUALITY_BASE_RESEARCH_COST, RESOURCE_QUALITY_BASE_RESEARCH_DURATION_MS, RESOURCE_QUALITY_RESEARCH_COST_GROWTH, RESOURCE_QUALITY_RESEARCH_DURATION_GROWTH } from '@/game/quality';
import type { ResearchEffect } from './researchEffects';

const BASE_RESEARCH_PROJECT_IDS = [
  'capital-grant-1', 'capital-grant-2', 'capital-grant-3', 'capital-grant-4', 'capital-grant-5', 'capital-grant-6', 'capital-grant-7', 'capital-grant-8', 'capital-grant-9', 'capital-grant-10',
  'sales-capacity-1', 'sales-capacity-2', 'sales-capacity-3', 'sales-capacity-4', 'sales-capacity-5',
  'sales-order-value-limit-1', 'sales-order-value-limit-2', 'sales-order-value-limit-3', 'sales-order-value-limit-4', 'sales-order-value-limit-5',
  'sales-targeting-1', 'sales-targeting-2', 'sales-targeting-3', 'sales-targeting-4', 'sales-targeting-5',
  'bid-value-1', 'bid-value-2', 'bid-value-3', 'bid-value-4', 'bid-value-5',
  'relationship-management-1', 'relationship-management-2', 'relationship-management-3', 'relationship-management-4', 'relationship-management-5',
  'sales-intelligence-1', 'sales-intelligence-2', 'sales-intelligence-3', 'sales-intelligence-4', 'sales-intelligence-5',
  'local-market-network-1', 'local-market-network-2', 'local-market-network-3', 'local-market-network-4', 'local-market-network-5', 'local-market-network-6', 'local-market-network-7', 'local-market-network-8', 'local-market-network-9', 'local-market-network-10',
  'market-diffusion-network-1', 'market-diffusion-network-2', 'market-diffusion-network-3', 'market-diffusion-network-4', 'market-diffusion-network-5', 'market-diffusion-network-6', 'market-diffusion-network-7', 'market-diffusion-network-8', 'market-diffusion-network-9', 'market-diffusion-network-10',
  'research-capacity-1', 'research-capacity-2', 'research-capacity-3', 'research-capacity-4', 'research-capacity-5', 'research-capacity-6', 'research-capacity-7', 'research-capacity-8', 'research-capacity-9', 'research-capacity-10',
  'repair-technician-1', 'repair-technician-2', 'repair-technician-3', 'repair-technician-4', 'repair-technician-5',
] as const;

export type RecipeResearchProjectId = `recipe-${RecipeName}` | `recipe-${RecipeName}-level-${number}`;
export type ResourceQualityResearchProjectId = `resource-quality-${ResourceType}-level-${number}`;
export type ResearchProjectId = (typeof BASE_RESEARCH_PROJECT_IDS)[number] | RecipeResearchProjectId | ResourceQualityResearchProjectId;
export const RESEARCH_PROJECT_IDS: readonly ResearchProjectId[] = [...BASE_RESEARCH_PROJECT_IDS, ...Object.values(RecipeName).flatMap((recipeName) => [getRecipeResearchProjectId(recipeName), ...Array.from({ length: 10 }, (_, index) => getRecipeResearchLevelProjectId(recipeName, index + 1))])];
export type ResearchChainId = 'capital-grants' | 'sales-capacity' | 'sales-order-value-limit' | 'sales-targeting' | 'bid-value' | 'relationship-management' | 'sales-intelligence' | 'local-market-network' | 'market-diffusion-network' | 'research-capacity' | 'repair-technician' | 'recipe-unlocks' | 'resource-quality';

export type ResearchProjectDefinition = {
  id: ResearchProjectId;
  chainId: ResearchChainId;
  tier: number;
  name: string;
  cost: number;
  durationMs: number;
  requirements: readonly GateRequirement[];
  effect: ResearchEffect;
};

const FACILITY_TIER_1: GateRequirement = { kind: 'achievement', achievementId: 'facility_portfolio_tier_1', label: 'Industrial Footprint 1' };
const CASH_TIER_1: GateRequirement = { kind: 'achievement', achievementId: 'cash_reserves_tier_1', label: 'Cash Reserves 1' };
const ORDERS_TIER_1: GateRequirement = { kind: 'achievement', achievementId: 'fulfilled_orders_tier_1', label: 'Order Closer 1' };
const ORDERS_TIER_2: GateRequirement = { kind: 'achievement', achievementId: 'fulfilled_orders_tier_2', label: 'Order Closer 2' };
const PRESTIGE_TIER_1: GateRequirement = { kind: 'minimum-prestige', minimumPrestige: 1 };

export function getRecipeResearchProjectId(recipeName: RecipeName): RecipeResearchProjectId {
  return `recipe-${recipeName}`;
}

export function getRecipeResearchLevelProjectId(recipeName: RecipeName, level: number): RecipeResearchProjectId {
  return `recipe-${recipeName}-level-${Math.max(1, Math.floor(level))}`;
}

export function getResourceQualityResearchProjectId(resourceType: ResourceType, level: number): ResourceQualityResearchProjectId {
  return `resource-quality-${resourceType}-level-${Math.max(1, Math.floor(level))}`;
}

export function getResourceQualityResearchLevel(projectId: string): { resourceType: ResourceType; level: number } | null {
  const match = /^resource-quality-(.+)-level-([1-9]\d*)$/u.exec(projectId);
  if (!match) return null;
  const resourceType = match[1] as ResourceType;
  const level = Number(match[2]);
  return RESOURCE_TYPES.includes(resourceType) && Number.isSafeInteger(level) ? { resourceType, level } : null;
}

function getResourceQualityResearchProject(resourceType: ResourceType, level: number): ResearchProjectDefinition {
  const normalizedLevel = Math.max(1, Math.floor(level));
  const previousId = normalizedLevel === 1 ? null : getResourceQualityResearchProjectId(resourceType, normalizedLevel - 1);
  const cost = Math.min(Number.MAX_SAFE_INTEGER, Math.ceil(scaleExponential(RESOURCE_QUALITY_BASE_RESEARCH_COST, normalizedLevel - 1, RESOURCE_QUALITY_RESEARCH_COST_GROWTH)));
  const durationMs = Math.min(Number.MAX_SAFE_INTEGER, Math.ceil(scaleExponential(RESOURCE_QUALITY_BASE_RESEARCH_DURATION_MS, normalizedLevel - 1, RESOURCE_QUALITY_RESEARCH_DURATION_GROWTH)));
  const quality = calculateResearchMaxQ(normalizedLevel);
  return {
    id: getResourceQualityResearchProjectId(resourceType, normalizedLevel),
    chainId: 'resource-quality',
    tier: normalizedLevel,
    name: `${getResource(resourceType).name} quality ${normalizedLevel}`,
    cost,
    durationMs,
    requirements: previousId
      ? [{ kind: 'research', projectId: previousId, label: `${getResource(resourceType).name} quality ${normalizedLevel - 1}` }]
      : [FACILITY_TIER_1],
    effect: { kind: 'resource-production-quality', resourceType, level: normalizedLevel, quality },
  };
}

const RECIPE_RESEARCH_PROJECTS: ResearchProjectDefinition[] = Object.values(FACILITIES).flatMap((facility) => facility.recipes.flatMap((recipe, recipeIndex) => {
  const baseCost = Math.ceil(facility.landCost * 0.5 + facility.constructionMaterialsCost * 0.5 + recipe.inputs.length * 25 + recipe.requiredWork * 5 + recipeIndex * 20);
  const baseDuration = Math.max(45_000, Math.ceil((facility.landCost + facility.constructionMaterialsCost + recipe.requiredWork * 10 + recipeIndex * 25) * 300));
  const recipeDisplayName = getRecipeDisplayName(recipe.name);
  const unlock: ResearchProjectDefinition = { id: getRecipeResearchProjectId(recipe.name), chainId: 'recipe-unlocks', tier: 1, name: `Recipe research: ${recipeDisplayName}`, cost: baseCost, durationMs: baseDuration, requirements: [FACILITY_TIER_1], effect: { kind: 'recipe-unlock', recipeName: recipe.name } };
  const bonusProjects = Array.from({ length: 10 }, (_, index): ResearchProjectDefinition => {
    const level = index + 1;
    const previousId = index === 0 ? getRecipeResearchProjectId(recipe.name) : getRecipeResearchLevelProjectId(recipe.name, level - 1);
    const previousLabel = index === 0 ? `Recipe research: ${recipeDisplayName}` : `${recipeDisplayName} work speed ${level - 1}`;
    return { id: getRecipeResearchLevelProjectId(recipe.name, level), chainId: 'recipe-unlocks', tier: level, name: `${recipeDisplayName} work speed ${level}`, cost: Math.ceil(baseCost * (1 + index * 0.75)), durationMs: Math.ceil(baseDuration * (1 + index * 0.5)), requirements: [{ kind: 'research', projectId: previousId, label: previousLabel }], effect: { kind: 'recipe-work-speed-bonus', recipeName: recipe.name, level } };
  });
  return [unlock, ...bonusProjects];
}));

export const RESEARCH_PROJECTS: readonly ResearchProjectDefinition[] = [
  { id: 'capital-grant-1', chainId: 'capital-grants', tier: 1, name: 'Capital Grant I', cost: 250, durationMs: 600_000, requirements: [FACILITY_TIER_1], effect: { kind: 'grant', amount: 500 } },
  { id: 'capital-grant-2', chainId: 'capital-grants', tier: 2, name: 'Capital Grant II', cost: 1_000, durationMs: 1_500_000, requirements: [{ kind: 'research', projectId: 'capital-grant-1', label: 'Capital Grant I' }, CASH_TIER_1], effect: { kind: 'grant', amount: 2_000 } },
  { id: 'capital-grant-3', chainId: 'capital-grants', tier: 3, name: 'Capital Grant III', cost: 5_000, durationMs: 4_500_000, requirements: [{ kind: 'research', projectId: 'capital-grant-2', label: 'Capital Grant II' }, ORDERS_TIER_1], effect: { kind: 'grant', amount: 10_000 } },
  { id: 'capital-grant-4', chainId: 'capital-grants', tier: 4, name: 'Capital Grant IV', cost: 25_000, durationMs: 13_500_000, requirements: [{ kind: 'research', projectId: 'capital-grant-3', label: 'Capital Grant III' }, PRESTIGE_TIER_1], effect: { kind: 'grant', amount: 50_000 } },
  { id: 'capital-grant-5', chainId: 'capital-grants', tier: 5, name: 'Capital Grant V', cost: 125_000, durationMs: 36_000_000, requirements: [{ kind: 'research', projectId: 'capital-grant-4', label: 'Capital Grant IV' }, ORDERS_TIER_2], effect: { kind: 'grant', amount: 250_000 } },
  { id: 'capital-grant-6', chainId: 'capital-grants', tier: 6, name: 'Capital Grant VI', cost: 500_000, durationMs: 72_000_000, requirements: [{ kind: 'research', projectId: 'capital-grant-5', label: 'Capital Grant V' }, PRESTIGE_TIER_1], effect: { kind: 'grant', amount: 1_000_000 } },
  { id: 'capital-grant-7', chainId: 'capital-grants', tier: 7, name: 'Capital Grant VII', cost: 2_000_000, durationMs: 144_000_000, requirements: [{ kind: 'research', projectId: 'capital-grant-6', label: 'Capital Grant VI' }, ORDERS_TIER_2], effect: { kind: 'grant', amount: 4_000_000 } },
  { id: 'capital-grant-8', chainId: 'capital-grants', tier: 8, name: 'Capital Grant VIII', cost: 8_000_000, durationMs: 288_000_000, requirements: [{ kind: 'research', projectId: 'capital-grant-7', label: 'Capital Grant VII' }, PRESTIGE_TIER_1], effect: { kind: 'grant', amount: 16_000_000 } },
  { id: 'capital-grant-9', chainId: 'capital-grants', tier: 9, name: 'Capital Grant IX', cost: 32_000_000, durationMs: 576_000_000, requirements: [{ kind: 'research', projectId: 'capital-grant-8', label: 'Capital Grant VIII' }, ORDERS_TIER_2], effect: { kind: 'grant', amount: 64_000_000 } },
  { id: 'capital-grant-10', chainId: 'capital-grants', tier: 10, name: 'Capital Grant X', cost: 128_000_000, durationMs: 1_152_000_000, requirements: [{ kind: 'research', projectId: 'capital-grant-9', label: 'Capital Grant IX' }, PRESTIGE_TIER_1], effect: { kind: 'grant', amount: 256_000_000 } },
  { id: 'sales-capacity-1', chainId: 'sales-capacity', tier: 1, name: 'Sales Capacity I', cost: 50, durationMs: 30_000, requirements: [FACILITY_TIER_1], effect: { kind: 'max-open-sales-orders', maximum: 3 } },
  { id: 'sales-capacity-2', chainId: 'sales-capacity', tier: 2, name: 'Sales Capacity II', cost: 1_000, durationMs: 60_000, requirements: [{ kind: 'research', projectId: 'sales-capacity-1', label: 'Sales Capacity I' }, ORDERS_TIER_1], effect: { kind: 'max-open-sales-orders', maximum: 5 } },
  { id: 'sales-capacity-3', chainId: 'sales-capacity', tier: 3, name: 'Sales Capacity III', cost: 3_000, durationMs: 180_000, requirements: [{ kind: 'research', projectId: 'sales-capacity-2', label: 'Sales Capacity II' }, CASH_TIER_1], effect: { kind: 'max-open-sales-orders', maximum: 7 } },
  { id: 'sales-capacity-4', chainId: 'sales-capacity', tier: 4, name: 'Sales Capacity IV', cost: 7_000, durationMs: 360_000, requirements: [{ kind: 'research', projectId: 'sales-capacity-3', label: 'Sales Capacity III' }, PRESTIGE_TIER_1], effect: { kind: 'max-open-sales-orders', maximum: 10 } },
  { id: 'sales-capacity-5', chainId: 'sales-capacity', tier: 5, name: 'Sales Capacity V', cost: 15_000, durationMs: 720_000, requirements: [{ kind: 'research', projectId: 'sales-capacity-4', label: 'Sales Capacity IV' }, ORDERS_TIER_2], effect: { kind: 'max-open-sales-orders', maximum: 15 } },
  { id: 'sales-order-value-limit-1', chainId: 'sales-order-value-limit', tier: 1, name: 'Order Scope I', cost: 75, durationMs: 45_000, requirements: [FACILITY_TIER_1], effect: { kind: 'sales-order-value-cap', maximumCompanyValueFraction: 0.75 } },
  { id: 'sales-order-value-limit-2', chainId: 'sales-order-value-limit', tier: 2, name: 'Order Scope II', cost: 750, durationMs: 120_000, requirements: [{ kind: 'research', projectId: 'sales-order-value-limit-1', label: 'Order Scope I' }, ORDERS_TIER_1], effect: { kind: 'sales-order-value-cap', maximumCompanyValueFraction: 1 } },
  { id: 'sales-order-value-limit-3', chainId: 'sales-order-value-limit', tier: 3, name: 'Order Scope III', cost: 3_000, durationMs: 300_000, requirements: [{ kind: 'research', projectId: 'sales-order-value-limit-2', label: 'Order Scope II' }, CASH_TIER_1], effect: { kind: 'sales-order-value-cap', maximumCompanyValueFraction: 1.5 } },
  { id: 'sales-order-value-limit-4', chainId: 'sales-order-value-limit', tier: 4, name: 'Order Scope IV', cost: 12_000, durationMs: 900_000, requirements: [{ kind: 'research', projectId: 'sales-order-value-limit-3', label: 'Order Scope III' }, PRESTIGE_TIER_1], effect: { kind: 'sales-order-value-cap', maximumCompanyValueFraction: 2.5 } },
  { id: 'sales-order-value-limit-5', chainId: 'sales-order-value-limit', tier: 5, name: 'Order Scope V', cost: 50_000, durationMs: 2_700_000, requirements: [{ kind: 'research', projectId: 'sales-order-value-limit-4', label: 'Order Scope IV' }, ORDERS_TIER_2], effect: { kind: 'sales-order-value-cap', maximumCompanyValueFraction: 4 } },
  { id: 'sales-targeting-1', chainId: 'sales-targeting', tier: 1, name: 'Sales Targeting I', cost: 100, durationMs: 120_000, requirements: [FACILITY_TIER_1], effect: { kind: 'sales-offer-produced-resource-weight', multiplier: 2 } },
  { id: 'sales-targeting-2', chainId: 'sales-targeting', tier: 2, name: 'Sales Targeting II', cost: 500, durationMs: 300_000, requirements: [{ kind: 'research', projectId: 'sales-targeting-1', label: 'Sales Targeting I' }, ORDERS_TIER_1], effect: { kind: 'sales-offer-produced-resource-weight', multiplier: 4 } },
  { id: 'sales-targeting-3', chainId: 'sales-targeting', tier: 3, name: 'Sales Targeting III', cost: 1_000, durationMs: 900_000, requirements: [{ kind: 'research', projectId: 'sales-targeting-2', label: 'Sales Targeting II' }, CASH_TIER_1], effect: { kind: 'sales-offer-produced-resource-weight', multiplier: 8 } },
  { id: 'sales-targeting-4', chainId: 'sales-targeting', tier: 4, name: 'Sales Targeting IV', cost: 3_000, durationMs: 2_700_000, requirements: [{ kind: 'research', projectId: 'sales-targeting-3', label: 'Sales Targeting III' }, PRESTIGE_TIER_1], effect: { kind: 'sales-offer-produced-resource-weight', multiplier: 16 } },
  { id: 'sales-targeting-5', chainId: 'sales-targeting', tier: 5, name: 'Sales Targeting V', cost: 10_000, durationMs: 7_200_000, requirements: [{ kind: 'research', projectId: 'sales-targeting-4', label: 'Sales Targeting IV' }, ORDERS_TIER_2], effect: { kind: 'sales-offer-produced-only' } },
  { id: 'bid-value-1', chainId: 'bid-value', tier: 1, name: 'Bid Value I', cost: 1_000, durationMs: 120_000, requirements: [FACILITY_TIER_1], effect: { kind: 'sales-order-bid-multiplier', multiplier: 1.1 } },
  { id: 'bid-value-2', chainId: 'bid-value', tier: 2, name: 'Bid Value II', cost: 4_000, durationMs: 300_000, requirements: [{ kind: 'research', projectId: 'bid-value-1', label: 'Bid Value I' }, ORDERS_TIER_1], effect: { kind: 'sales-order-bid-multiplier', multiplier: 1.2 } },
  { id: 'bid-value-3', chainId: 'bid-value', tier: 3, name: 'Bid Value III', cost: 12_000, durationMs: 900_000, requirements: [{ kind: 'research', projectId: 'bid-value-2', label: 'Bid Value II' }, CASH_TIER_1], effect: { kind: 'sales-order-bid-multiplier', multiplier: 1.3 } },
  { id: 'bid-value-4', chainId: 'bid-value', tier: 4, name: 'Bid Value IV', cost: 40_000, durationMs: 2_700_000, requirements: [{ kind: 'research', projectId: 'bid-value-3', label: 'Bid Value III' }, PRESTIGE_TIER_1], effect: { kind: 'sales-order-bid-multiplier', multiplier: 1.4 } },
  { id: 'bid-value-5', chainId: 'bid-value', tier: 5, name: 'Bid Value V', cost: 125_000, durationMs: 7_200_000, requirements: [{ kind: 'research', projectId: 'bid-value-4', label: 'Bid Value IV' }, ORDERS_TIER_2], effect: { kind: 'sales-order-bid-multiplier', multiplier: 1.5 } },
  { id: 'relationship-management-1', chainId: 'relationship-management', tier: 1, name: 'Relationship Management I', cost: 1_200, durationMs: 180_000, requirements: [ORDERS_TIER_1], effect: { kind: 'sales-relationship-decay-half-life', multiplier: 1.1 } },
  { id: 'relationship-management-2', chainId: 'relationship-management', tier: 2, name: 'Relationship Management II', cost: 4_000, durationMs: 480_000, requirements: [{ kind: 'research', projectId: 'relationship-management-1', label: 'Relationship Management I' }, CASH_TIER_1], effect: { kind: 'sales-relationship-fulfilment-gain', multiplier: 1.08 } },
  { id: 'relationship-management-3', chainId: 'relationship-management', tier: 3, name: 'Relationship Management III', cost: 12_000, durationMs: 1_200_000, requirements: [{ kind: 'research', projectId: 'relationship-management-2', label: 'Relationship Management II' }, PRESTIGE_TIER_1], effect: { kind: 'sales-relationship-failure-loss', multiplier: 0.92 } },
  { id: 'relationship-management-4', chainId: 'relationship-management', tier: 4, name: 'Relationship Management IV', cost: 36_000, durationMs: 3_000_000, requirements: [{ kind: 'research', projectId: 'relationship-management-3', label: 'Relationship Management III' }, ORDERS_TIER_2], effect: { kind: 'sales-relationship-decay-half-life', multiplier: 1.25 } },
  { id: 'relationship-management-5', chainId: 'relationship-management', tier: 5, name: 'Relationship Management V', cost: 100_000, durationMs: 7_200_000, requirements: [{ kind: 'research', projectId: 'relationship-management-4', label: 'Relationship Management IV' }, PRESTIGE_TIER_1], effect: { kind: 'sales-relationship-failure-loss', multiplier: 0.8 } },
  { id: 'sales-intelligence-1', chainId: 'sales-intelligence', tier: 1, name: 'Sales Intelligence I', cost: 1_500, durationMs: 180_000, requirements: [ORDERS_TIER_1], effect: { kind: 'sales-pressure-offer-chance', multiplier: 0.9 } },
  { id: 'sales-intelligence-2', chainId: 'sales-intelligence', tier: 2, name: 'Sales Intelligence II', cost: 5_000, durationMs: 480_000, requirements: [{ kind: 'research', projectId: 'sales-intelligence-1', label: 'Sales Intelligence I' }, CASH_TIER_1], effect: { kind: 'sales-order-bundle-maturity', multiplier: 1.08 } },
  { id: 'sales-intelligence-3', chainId: 'sales-intelligence', tier: 3, name: 'Sales Intelligence III', cost: 15_000, durationMs: 1_200_000, requirements: [{ kind: 'research', projectId: 'sales-intelligence-2', label: 'Sales Intelligence II' }, PRESTIGE_TIER_1], effect: { kind: 'sales-order-minimum-premium-bonus', bonus: 0.03 } },
  { id: 'sales-intelligence-4', chainId: 'sales-intelligence', tier: 4, name: 'Sales Intelligence IV', cost: 45_000, durationMs: 3_000_000, requirements: [{ kind: 'research', projectId: 'sales-intelligence-3', label: 'Sales Intelligence III' }, ORDERS_TIER_2], effect: { kind: 'sales-order-bundle-maturity', multiplier: 1.2 } },
  { id: 'sales-intelligence-5', chainId: 'sales-intelligence', tier: 5, name: 'Sales Intelligence V', cost: 125_000, durationMs: 7_200_000, requirements: [{ kind: 'research', projectId: 'sales-intelligence-4', label: 'Sales Intelligence IV' }, PRESTIGE_TIER_1], effect: { kind: 'sales-order-minimum-premium-bonus', bonus: 0.08 } },
  { id: 'local-market-network-1', chainId: 'local-market-network', tier: 1, name: 'Local Market Network I', cost: 750, durationMs: 90_000, requirements: [FACILITY_TIER_1], effect: { kind: 'local-market-depth', multiplier: 1.2 } },
  { id: 'local-market-network-2', chainId: 'local-market-network', tier: 2, name: 'Local Market Network II', cost: 2_500, durationMs: 240_000, requirements: [{ kind: 'research', projectId: 'local-market-network-1', label: 'Local Market Network I' }, ORDERS_TIER_1], effect: { kind: 'local-market-depth', multiplier: 1.5 } },
  { id: 'local-market-network-3', chainId: 'local-market-network', tier: 3, name: 'Local Market Network III', cost: 8_000, durationMs: 720_000, requirements: [{ kind: 'research', projectId: 'local-market-network-2', label: 'Local Market Network II' }, CASH_TIER_1], effect: { kind: 'local-market-depth', multiplier: 1.9 } },
  { id: 'local-market-network-4', chainId: 'local-market-network', tier: 4, name: 'Local Market Network IV', cost: 24_000, durationMs: 1_800_000, requirements: [{ kind: 'research', projectId: 'local-market-network-3', label: 'Local Market Network III' }], effect: { kind: 'local-market-depth', multiplier: 2.4 } },
  { id: 'local-market-network-5', chainId: 'local-market-network', tier: 5, name: 'Local Market Network V', cost: 72_000, durationMs: 3_600_000, requirements: [{ kind: 'research', projectId: 'local-market-network-4', label: 'Local Market Network IV' }], effect: { kind: 'local-market-depth', multiplier: 3.1 } },
  { id: 'local-market-network-6', chainId: 'local-market-network', tier: 6, name: 'Local Market Network VI', cost: 200_000, durationMs: 7_200_000, requirements: [{ kind: 'research', projectId: 'local-market-network-5', label: 'Local Market Network V' }], effect: { kind: 'local-market-depth', multiplier: 3.9 } },
  { id: 'local-market-network-7', chainId: 'local-market-network', tier: 7, name: 'Local Market Network VII', cost: 500_000, durationMs: 14_400_000, requirements: [{ kind: 'research', projectId: 'local-market-network-6', label: 'Local Market Network VI' }], effect: { kind: 'local-market-depth', multiplier: 4.8 } },
  { id: 'local-market-network-8', chainId: 'local-market-network', tier: 8, name: 'Local Market Network VIII', cost: 1_200_000, durationMs: 28_800_000, requirements: [{ kind: 'research', projectId: 'local-market-network-7', label: 'Local Market Network VII' }], effect: { kind: 'local-market-depth', multiplier: 5.8 } },
  { id: 'local-market-network-9', chainId: 'local-market-network', tier: 9, name: 'Local Market Network IX', cost: 3_000_000, durationMs: 57_600_000, requirements: [{ kind: 'research', projectId: 'local-market-network-8', label: 'Local Market Network VIII' }], effect: { kind: 'local-market-depth', multiplier: 6.9 } },
  { id: 'local-market-network-10', chainId: 'local-market-network', tier: 10, name: 'Local Market Network X', cost: 7_000_000, durationMs: 115_200_000, requirements: [{ kind: 'research', projectId: 'local-market-network-9', label: 'Local Market Network IX' }], effect: { kind: 'local-market-depth', multiplier: 8 } },
  { id: 'market-diffusion-network-1', chainId: 'market-diffusion-network', tier: 1, name: 'Market Diffusion Network I', cost: 600, durationMs: 60_000, requirements: [FACILITY_TIER_1], effect: { kind: 'local-regional-diffusion', multiplier: 1.15 } },
  { id: 'market-diffusion-network-2', chainId: 'market-diffusion-network', tier: 2, name: 'Market Diffusion Network II', cost: 1_800, durationMs: 180_000, requirements: [{ kind: 'research', projectId: 'market-diffusion-network-1', label: 'Market Diffusion Network I' }, ORDERS_TIER_1], effect: { kind: 'local-regional-diffusion', multiplier: 1.3 } },
  { id: 'market-diffusion-network-3', chainId: 'market-diffusion-network', tier: 3, name: 'Market Diffusion Network III', cost: 5_500, durationMs: 540_000, requirements: [{ kind: 'research', projectId: 'market-diffusion-network-2', label: 'Market Diffusion Network II' }, CASH_TIER_1], effect: { kind: 'local-regional-diffusion', multiplier: 1.5 } },
  { id: 'market-diffusion-network-4', chainId: 'market-diffusion-network', tier: 4, name: 'Market Diffusion Network IV', cost: 16_000, durationMs: 1_350_000, requirements: [{ kind: 'research', projectId: 'market-diffusion-network-3', label: 'Market Diffusion Network III' }], effect: { kind: 'local-regional-diffusion', multiplier: 1.7 } },
  { id: 'market-diffusion-network-5', chainId: 'market-diffusion-network', tier: 5, name: 'Market Diffusion Network V', cost: 48_000, durationMs: 3_600_000, requirements: [{ kind: 'research', projectId: 'market-diffusion-network-4', label: 'Market Diffusion Network IV' }], effect: { kind: 'local-regional-diffusion', multiplier: 2 } },
  { id: 'market-diffusion-network-6', chainId: 'market-diffusion-network', tier: 6, name: 'Market Diffusion Network VI', cost: 135_000, durationMs: 7_200_000, requirements: [{ kind: 'research', projectId: 'market-diffusion-network-5', label: 'Market Diffusion Network V' }], effect: { kind: 'local-regional-diffusion', multiplier: 2.3 } },
  { id: 'market-diffusion-network-7', chainId: 'market-diffusion-network', tier: 7, name: 'Market Diffusion Network VII', cost: 350_000, durationMs: 14_400_000, requirements: [{ kind: 'research', projectId: 'market-diffusion-network-6', label: 'Market Diffusion Network VI' }], effect: { kind: 'local-regional-diffusion', multiplier: 2.6 } },
  { id: 'market-diffusion-network-8', chainId: 'market-diffusion-network', tier: 8, name: 'Market Diffusion Network VIII', cost: 900_000, durationMs: 28_800_000, requirements: [{ kind: 'research', projectId: 'market-diffusion-network-7', label: 'Market Diffusion Network VII' }], effect: { kind: 'local-regional-diffusion', multiplier: 3 } },
  { id: 'market-diffusion-network-9', chainId: 'market-diffusion-network', tier: 9, name: 'Market Diffusion Network IX', cost: 2_200_000, durationMs: 57_600_000, requirements: [{ kind: 'research', projectId: 'market-diffusion-network-8', label: 'Market Diffusion Network VIII' }], effect: { kind: 'local-regional-diffusion', multiplier: 3.5 } },
  { id: 'market-diffusion-network-10', chainId: 'market-diffusion-network', tier: 10, name: 'Market Diffusion Network X', cost: 5_500_000, durationMs: 115_200_000, requirements: [{ kind: 'research', projectId: 'market-diffusion-network-9', label: 'Market Diffusion Network IX' }], effect: { kind: 'local-regional-diffusion', multiplier: 4 } },
  { id: 'research-capacity-1', chainId: 'research-capacity', tier: 1, name: 'Research Capacity I', cost: 200, durationMs: 120_000, requirements: [FACILITY_TIER_1], effect: { kind: 'research-capacity', additionalSlots: 1 } },
  { id: 'research-capacity-2', chainId: 'research-capacity', tier: 2, name: 'Research Capacity II', cost: 800, durationMs: 300_000, requirements: [{ kind: 'research', projectId: 'research-capacity-1', label: 'Research Capacity I' }, ORDERS_TIER_1], effect: { kind: 'research-capacity', additionalSlots: 1 } },
  { id: 'research-capacity-3', chainId: 'research-capacity', tier: 3, name: 'Research Capacity III', cost: 2_400, durationMs: 900_000, requirements: [{ kind: 'research', projectId: 'research-capacity-2', label: 'Research Capacity II' }, CASH_TIER_1], effect: { kind: 'research-capacity', additionalSlots: 1 } },
  { id: 'research-capacity-4', chainId: 'research-capacity', tier: 4, name: 'Research Capacity IV', cost: 8_000, durationMs: 2_700_000, requirements: [{ kind: 'research', projectId: 'research-capacity-3', label: 'Research Capacity III' }, PRESTIGE_TIER_1], effect: { kind: 'research-capacity', additionalSlots: 1 } },
  { id: 'research-capacity-5', chainId: 'research-capacity', tier: 5, name: 'Research Capacity V', cost: 25_000, durationMs: 7_200_000, requirements: [{ kind: 'research', projectId: 'research-capacity-4', label: 'Research Capacity IV' }, ORDERS_TIER_2], effect: { kind: 'research-capacity', additionalSlots: 1 } },
  { id: 'research-capacity-6', chainId: 'research-capacity', tier: 6, name: 'Research Capacity VI', cost: 80_000, durationMs: 14_400_000, requirements: [{ kind: 'research', projectId: 'research-capacity-5', label: 'Research Capacity V' }], effect: { kind: 'research-capacity', additionalSlots: 1 } },
  { id: 'research-capacity-7', chainId: 'research-capacity', tier: 7, name: 'Research Capacity VII', cost: 240_000, durationMs: 28_800_000, requirements: [{ kind: 'research', projectId: 'research-capacity-6', label: 'Research Capacity VI' }], effect: { kind: 'research-capacity', additionalSlots: 1 } },
  { id: 'research-capacity-8', chainId: 'research-capacity', tier: 8, name: 'Research Capacity VIII', cost: 720_000, durationMs: 57_600_000, requirements: [{ kind: 'research', projectId: 'research-capacity-7', label: 'Research Capacity VII' }], effect: { kind: 'research-capacity', additionalSlots: 1 } },
  { id: 'research-capacity-9', chainId: 'research-capacity', tier: 9, name: 'Research Capacity IX', cost: 2_000_000, durationMs: 115_200_000, requirements: [{ kind: 'research', projectId: 'research-capacity-8', label: 'Research Capacity VIII' }], effect: { kind: 'research-capacity', additionalSlots: 1 } },
  { id: 'research-capacity-10', chainId: 'research-capacity', tier: 10, name: 'Research Capacity X', cost: 6_000_000, durationMs: 230_400_000, requirements: [{ kind: 'research', projectId: 'research-capacity-9', label: 'Research Capacity IX' }], effect: { kind: 'research-capacity', additionalSlots: 1 } },
  { id: 'repair-technician-1', chainId: 'repair-technician', tier: 1, name: 'Repair Technician I', cost: 1_000, durationMs: 180_000, requirements: [FACILITY_TIER_1], effect: { kind: 'facility-auto-repair', maximumFacilities: 1 } },
  { id: 'repair-technician-2', chainId: 'repair-technician', tier: 2, name: 'Repair Technician II', cost: 5_000, durationMs: 480_000, requirements: [{ kind: 'research', projectId: 'repair-technician-1', label: 'Repair Technician I' }, ORDERS_TIER_1], effect: { kind: 'facility-auto-repair', maximumFacilities: 2 } },
  { id: 'repair-technician-3', chainId: 'repair-technician', tier: 3, name: 'Repair Technician III', cost: 15_000, durationMs: 1_200_000, requirements: [{ kind: 'research', projectId: 'repair-technician-2', label: 'Repair Technician II' }, CASH_TIER_1], effect: { kind: 'facility-auto-repair', maximumFacilities: 3 } },
  { id: 'repair-technician-4', chainId: 'repair-technician', tier: 4, name: 'Repair Technician IV', cost: 45_000, durationMs: 3_000_000, requirements: [{ kind: 'research', projectId: 'repair-technician-3', label: 'Repair Technician III' }, PRESTIGE_TIER_1], effect: { kind: 'facility-auto-repair', maximumFacilities: 4 } },
  { id: 'repair-technician-5', chainId: 'repair-technician', tier: 5, name: 'Repair Technician V', cost: 125_000, durationMs: 7_200_000, requirements: [{ kind: 'research', projectId: 'repair-technician-4', label: 'Repair Technician IV' }, ORDERS_TIER_2], effect: { kind: 'facility-auto-repair', maximumFacilities: 5 } },
  ...RECIPE_RESEARCH_PROJECTS,
];

export const RESEARCH_PROJECTS_BY_ID: Readonly<Record<string, ResearchProjectDefinition>> = Object.fromEntries(
  RESEARCH_PROJECTS.map((project) => [project.id, project]),
) as Record<string, ResearchProjectDefinition>;

export function getResearchProject(projectId: string): ResearchProjectDefinition | null {
  const fixedProject = RESEARCH_PROJECTS_BY_ID[projectId];
  if (fixedProject) return fixedProject;
  const resourceQuality = getResourceQualityResearchLevel(projectId);
  return resourceQuality ? getResourceQualityResearchProject(resourceQuality.resourceType, resourceQuality.level) : null;
}
