import type { GateRequirement } from '@/game/gates';
import { FACILITIES } from '@/game/facilities';
import { getRecipeDisplayName, RecipeName } from '@/game/recipes';
import type { ResearchEffect } from './researchEffects';

const BASE_RESEARCH_PROJECT_IDS = [
  'capital-grant-1', 'capital-grant-2', 'capital-grant-3', 'capital-grant-4', 'capital-grant-5', 'capital-grant-6', 'capital-grant-7', 'capital-grant-8', 'capital-grant-9', 'capital-grant-10',
  'sales-capacity-1', 'sales-capacity-2', 'sales-capacity-3', 'sales-capacity-4', 'sales-capacity-5',
  'sales-targeting-1', 'sales-targeting-2', 'sales-targeting-3', 'sales-targeting-4', 'sales-targeting-5',
  'contract-value-1', 'contract-value-2', 'contract-value-3', 'contract-value-4', 'contract-value-5',
] as const;

export type RecipeResearchProjectId = `recipe-${RecipeName}` | `recipe-${RecipeName}-level-${number}`;
export type ResearchProjectId = (typeof BASE_RESEARCH_PROJECT_IDS)[number] | RecipeResearchProjectId;
export const RESEARCH_PROJECT_IDS: readonly ResearchProjectId[] = [...BASE_RESEARCH_PROJECT_IDS, ...Object.values(RecipeName).flatMap((recipeName) => [getRecipeResearchProjectId(recipeName), ...Array.from({ length: 10 }, (_, index) => getRecipeResearchLevelProjectId(recipeName, index + 1))])];
export type ResearchChainId = 'capital-grants' | 'sales-capacity' | 'sales-targeting' | 'contract-value' | 'recipe-unlocks';

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
const CONTRACTS_TIER_1: GateRequirement = { kind: 'achievement', achievementId: 'fulfilled_contracts_tier_1', label: 'Contract Closer 1' };
const CONTRACTS_TIER_2: GateRequirement = { kind: 'achievement', achievementId: 'fulfilled_contracts_tier_2', label: 'Contract Closer 2' };
const PRESTIGE_TIER_1: GateRequirement = { kind: 'minimum-prestige', minimumPrestige: 1 };

export function getRecipeResearchProjectId(recipeName: RecipeName): RecipeResearchProjectId {
  return `recipe-${recipeName}`;
}

export function getRecipeResearchLevelProjectId(recipeName: RecipeName, level: number): RecipeResearchProjectId {
  return `recipe-${recipeName}-level-${Math.max(1, Math.floor(level))}`;
}

const RECIPE_RESEARCH_PROJECTS: ResearchProjectDefinition[] = Object.values(FACILITIES).flatMap((facility) => facility.recipes.flatMap((recipe, recipeIndex) => {
  const baseCost = Math.ceil(facility.landCost * 0.5 + facility.constructionMaterialsCost * 0.5 + recipe.inputs.length * 25 + recipe.requiredWork * 5 + recipeIndex * 20);
  const baseDuration = Math.max(15_000, Math.ceil((facility.landCost + facility.constructionMaterialsCost + recipe.requiredWork * 10 + recipeIndex * 25) * 100));
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
  { id: 'capital-grant-1', chainId: 'capital-grants', tier: 1, name: 'Capital Grant I', cost: 500, durationMs: 120_000, requirements: [FACILITY_TIER_1], effect: { kind: 'grant', amount: 1_000 } },
  { id: 'capital-grant-2', chainId: 'capital-grants', tier: 2, name: 'Capital Grant II', cost: 2_000, durationMs: 300_000, requirements: [{ kind: 'research', projectId: 'capital-grant-1', label: 'Capital Grant I' }, CASH_TIER_1], effect: { kind: 'grant', amount: 4_000 } },
  { id: 'capital-grant-3', chainId: 'capital-grants', tier: 3, name: 'Capital Grant III', cost: 10_000, durationMs: 900_000, requirements: [{ kind: 'research', projectId: 'capital-grant-2', label: 'Capital Grant II' }, CONTRACTS_TIER_1], effect: { kind: 'grant', amount: 20_000 } },
  { id: 'capital-grant-4', chainId: 'capital-grants', tier: 4, name: 'Capital Grant IV', cost: 50_000, durationMs: 2_700_000, requirements: [{ kind: 'research', projectId: 'capital-grant-3', label: 'Capital Grant III' }, PRESTIGE_TIER_1], effect: { kind: 'grant', amount: 100_000 } },
  { id: 'capital-grant-5', chainId: 'capital-grants', tier: 5, name: 'Capital Grant V', cost: 250_000, durationMs: 7_200_000, requirements: [{ kind: 'research', projectId: 'capital-grant-4', label: 'Capital Grant IV' }, CONTRACTS_TIER_2], effect: { kind: 'grant', amount: 500_000 } },
  { id: 'capital-grant-6', chainId: 'capital-grants', tier: 6, name: 'Capital Grant VI', cost: 1_000_000, durationMs: 14_400_000, requirements: [{ kind: 'research', projectId: 'capital-grant-5', label: 'Capital Grant V' }, PRESTIGE_TIER_1], effect: { kind: 'grant', amount: 2_000_000 } },
  { id: 'capital-grant-7', chainId: 'capital-grants', tier: 7, name: 'Capital Grant VII', cost: 4_000_000, durationMs: 28_800_000, requirements: [{ kind: 'research', projectId: 'capital-grant-6', label: 'Capital Grant VI' }, CONTRACTS_TIER_2], effect: { kind: 'grant', amount: 8_000_000 } },
  { id: 'capital-grant-8', chainId: 'capital-grants', tier: 8, name: 'Capital Grant VIII', cost: 16_000_000, durationMs: 57_600_000, requirements: [{ kind: 'research', projectId: 'capital-grant-7', label: 'Capital Grant VII' }, PRESTIGE_TIER_1], effect: { kind: 'grant', amount: 32_000_000 } },
  { id: 'capital-grant-9', chainId: 'capital-grants', tier: 9, name: 'Capital Grant IX', cost: 64_000_000, durationMs: 115_200_000, requirements: [{ kind: 'research', projectId: 'capital-grant-8', label: 'Capital Grant VIII' }, CONTRACTS_TIER_2], effect: { kind: 'grant', amount: 128_000_000 } },
  { id: 'capital-grant-10', chainId: 'capital-grants', tier: 10, name: 'Capital Grant X', cost: 256_000_000, durationMs: 230_400_000, requirements: [{ kind: 'research', projectId: 'capital-grant-9', label: 'Capital Grant IX' }, PRESTIGE_TIER_1], effect: { kind: 'grant', amount: 512_000_000 } },
  { id: 'sales-capacity-1', chainId: 'sales-capacity', tier: 1, name: 'Sales Capacity I', cost: 500, durationMs: 30_000, requirements: [FACILITY_TIER_1], effect: { kind: 'max-open-sales-contracts', maximum: 3 } },
  { id: 'sales-capacity-2', chainId: 'sales-capacity', tier: 2, name: 'Sales Capacity II', cost: 1_500, durationMs: 60_000, requirements: [{ kind: 'research', projectId: 'sales-capacity-1', label: 'Sales Capacity I' }, CONTRACTS_TIER_1], effect: { kind: 'max-open-sales-contracts', maximum: 5 } },
  { id: 'sales-capacity-3', chainId: 'sales-capacity', tier: 3, name: 'Sales Capacity III', cost: 4_000, durationMs: 180_000, requirements: [{ kind: 'research', projectId: 'sales-capacity-2', label: 'Sales Capacity II' }, CASH_TIER_1], effect: { kind: 'max-open-sales-contracts', maximum: 7 } },
  { id: 'sales-capacity-4', chainId: 'sales-capacity', tier: 4, name: 'Sales Capacity IV', cost: 9_000, durationMs: 360_000, requirements: [{ kind: 'research', projectId: 'sales-capacity-3', label: 'Sales Capacity III' }, PRESTIGE_TIER_1], effect: { kind: 'max-open-sales-contracts', maximum: 10 } },
  { id: 'sales-capacity-5', chainId: 'sales-capacity', tier: 5, name: 'Sales Capacity V', cost: 20_000, durationMs: 720_000, requirements: [{ kind: 'research', projectId: 'sales-capacity-4', label: 'Sales Capacity IV' }, CONTRACTS_TIER_2], effect: { kind: 'max-open-sales-contracts', maximum: 15 } },
  { id: 'sales-targeting-1', chainId: 'sales-targeting', tier: 1, name: 'Sales Targeting I', cost: 1_000, durationMs: 120_000, requirements: [FACILITY_TIER_1], effect: { kind: 'sales-offer-produced-resource-weight', multiplier: 2 } },
  { id: 'sales-targeting-2', chainId: 'sales-targeting', tier: 2, name: 'Sales Targeting II', cost: 3_000, durationMs: 300_000, requirements: [{ kind: 'research', projectId: 'sales-targeting-1', label: 'Sales Targeting I' }, CONTRACTS_TIER_1], effect: { kind: 'sales-offer-produced-resource-weight', multiplier: 4 } },
  { id: 'sales-targeting-3', chainId: 'sales-targeting', tier: 3, name: 'Sales Targeting III', cost: 10_000, durationMs: 900_000, requirements: [{ kind: 'research', projectId: 'sales-targeting-2', label: 'Sales Targeting II' }, CASH_TIER_1], effect: { kind: 'sales-offer-produced-resource-weight', multiplier: 8 } },
  { id: 'sales-targeting-4', chainId: 'sales-targeting', tier: 4, name: 'Sales Targeting IV', cost: 30_000, durationMs: 2_700_000, requirements: [{ kind: 'research', projectId: 'sales-targeting-3', label: 'Sales Targeting III' }, PRESTIGE_TIER_1], effect: { kind: 'sales-offer-produced-resource-weight', multiplier: 16 } },
  { id: 'sales-targeting-5', chainId: 'sales-targeting', tier: 5, name: 'Sales Targeting V', cost: 100_000, durationMs: 7_200_000, requirements: [{ kind: 'research', projectId: 'sales-targeting-4', label: 'Sales Targeting IV' }, CONTRACTS_TIER_2], effect: { kind: 'sales-offer-produced-only' } },
  { id: 'contract-value-1', chainId: 'contract-value', tier: 1, name: 'Contract Value I', cost: 1_000, durationMs: 120_000, requirements: [FACILITY_TIER_1], effect: { kind: 'sales-contract-premium', multiplier: 1.25 } },
  { id: 'contract-value-2', chainId: 'contract-value', tier: 2, name: 'Contract Value II', cost: 4_000, durationMs: 300_000, requirements: [{ kind: 'research', projectId: 'contract-value-1', label: 'Contract Value I' }, CONTRACTS_TIER_1], effect: { kind: 'sales-contract-premium', multiplier: 1.3 } },
  { id: 'contract-value-3', chainId: 'contract-value', tier: 3, name: 'Contract Value III', cost: 12_000, durationMs: 900_000, requirements: [{ kind: 'research', projectId: 'contract-value-2', label: 'Contract Value II' }, CASH_TIER_1], effect: { kind: 'sales-contract-premium', multiplier: 1.35 } },
  { id: 'contract-value-4', chainId: 'contract-value', tier: 4, name: 'Contract Value IV', cost: 40_000, durationMs: 2_700_000, requirements: [{ kind: 'research', projectId: 'contract-value-3', label: 'Contract Value III' }, PRESTIGE_TIER_1], effect: { kind: 'sales-contract-premium', multiplier: 1.4 } },
  { id: 'contract-value-5', chainId: 'contract-value', tier: 5, name: 'Contract Value V', cost: 125_000, durationMs: 7_200_000, requirements: [{ kind: 'research', projectId: 'contract-value-4', label: 'Contract Value IV' }, CONTRACTS_TIER_2], effect: { kind: 'sales-contract-premium', multiplier: 1.5 } },
  ...RECIPE_RESEARCH_PROJECTS,
];

export const RESEARCH_PROJECTS_BY_ID: Readonly<Record<ResearchProjectId, ResearchProjectDefinition>> = Object.fromEntries(
  RESEARCH_PROJECTS.map((project) => [project.id, project]),
) as Record<ResearchProjectId, ResearchProjectDefinition>;

export function getResearchProject(projectId: string): ResearchProjectDefinition | null {
  return (RESEARCH_PROJECTS_BY_ID as Record<string, ResearchProjectDefinition | undefined>)[projectId] ?? null;
}
