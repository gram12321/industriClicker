import type { GateRequirement } from '@/game/gates';
import { FACILITIES } from '@/game/facilities';
import { getRecipeDisplayName, RecipeName } from '@/game/recipes';
import type { ResearchEffect } from './researchEffects';

const BASE_RESEARCH_PROJECT_IDS = [
  'capital-grant-1', 'capital-grant-2', 'capital-grant-3', 'capital-grant-4', 'capital-grant-5', 'capital-grant-6', 'capital-grant-7', 'capital-grant-8', 'capital-grant-9', 'capital-grant-10',
  'sales-capacity-1', 'sales-capacity-2', 'sales-capacity-3', 'sales-capacity-4', 'sales-capacity-5',
] as const;

export type RecipeResearchProjectId = `recipe-${RecipeName}` | `recipe-${RecipeName}-level-${number}`;
export type ResearchProjectId = (typeof BASE_RESEARCH_PROJECT_IDS)[number] | RecipeResearchProjectId;
export const RESEARCH_PROJECT_IDS: readonly ResearchProjectId[] = [...BASE_RESEARCH_PROJECT_IDS, ...Object.values(RecipeName).flatMap((recipeName) => [getRecipeResearchProjectId(recipeName), ...Array.from({ length: 10 }, (_, index) => getRecipeResearchLevelProjectId(recipeName, index + 1))])];
export type ResearchChainId = 'capital-grants' | 'sales-capacity' | 'recipe-unlocks';

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
  { id: 'capital-grant-1', chainId: 'capital-grants', tier: 1, name: 'Capital Grant I', cost: 50, durationMs: 30_000, requirements: [FACILITY_TIER_1], effect: { kind: 'grant', amount: 5_000 } },
  { id: 'capital-grant-2', chainId: 'capital-grants', tier: 2, name: 'Capital Grant II', cost: 2_500, durationMs: 120_000, requirements: [{ kind: 'research', projectId: 'capital-grant-1', label: 'Capital Grant I' }, CASH_TIER_1], effect: { kind: 'grant', amount: 10_000 } },
  { id: 'capital-grant-3', chainId: 'capital-grants', tier: 3, name: 'Capital Grant III', cost: 7_500, durationMs: 240_000, requirements: [{ kind: 'research', projectId: 'capital-grant-2', label: 'Capital Grant II' }, CONTRACTS_TIER_1], effect: { kind: 'grant', amount: 20_000 } },
  { id: 'capital-grant-4', chainId: 'capital-grants', tier: 4, name: 'Capital Grant IV', cost: 17_500, durationMs: 480_000, requirements: [{ kind: 'research', projectId: 'capital-grant-3', label: 'Capital Grant III' }, PRESTIGE_TIER_1], effect: { kind: 'grant', amount: 35_000 } },
  { id: 'capital-grant-5', chainId: 'capital-grants', tier: 5, name: 'Capital Grant V', cost: 35_000, durationMs: 900_000, requirements: [{ kind: 'research', projectId: 'capital-grant-4', label: 'Capital Grant IV' }, CONTRACTS_TIER_2], effect: { kind: 'grant', amount: 60_000 } },
  { id: 'capital-grant-6', chainId: 'capital-grants', tier: 6, name: 'Capital Grant VI', cost: 60_000, durationMs: 1_200_000, requirements: [{ kind: 'research', projectId: 'capital-grant-5', label: 'Capital Grant V' }, PRESTIGE_TIER_1], effect: { kind: 'grant', amount: 100_000 } },
  { id: 'capital-grant-7', chainId: 'capital-grants', tier: 7, name: 'Capital Grant VII', cost: 100_000, durationMs: 1_500_000, requirements: [{ kind: 'research', projectId: 'capital-grant-6', label: 'Capital Grant VI' }, CONTRACTS_TIER_2], effect: { kind: 'grant', amount: 160_000 } },
  { id: 'capital-grant-8', chainId: 'capital-grants', tier: 8, name: 'Capital Grant VIII', cost: 160_000, durationMs: 1_800_000, requirements: [{ kind: 'research', projectId: 'capital-grant-7', label: 'Capital Grant VII' }, PRESTIGE_TIER_1], effect: { kind: 'grant', amount: 250_000 } },
  { id: 'capital-grant-9', chainId: 'capital-grants', tier: 9, name: 'Capital Grant IX', cost: 250_000, durationMs: 2_100_000, requirements: [{ kind: 'research', projectId: 'capital-grant-8', label: 'Capital Grant VIII' }, CONTRACTS_TIER_2], effect: { kind: 'grant', amount: 400_000 } },
  { id: 'capital-grant-10', chainId: 'capital-grants', tier: 10, name: 'Capital Grant X', cost: 400_000, durationMs: 2_400_000, requirements: [{ kind: 'research', projectId: 'capital-grant-9', label: 'Capital Grant IX' }, PRESTIGE_TIER_1], effect: { kind: 'grant', amount: 650_000 } },
  { id: 'sales-capacity-1', chainId: 'sales-capacity', tier: 1, name: 'Sales Capacity I', cost: 500, durationMs: 30_000, requirements: [FACILITY_TIER_1], effect: { kind: 'max-open-sales-contracts', maximum: 2 } },
  { id: 'sales-capacity-2', chainId: 'sales-capacity', tier: 2, name: 'Sales Capacity II', cost: 1_500, durationMs: 60_000, requirements: [{ kind: 'research', projectId: 'sales-capacity-1', label: 'Sales Capacity I' }, CONTRACTS_TIER_1], effect: { kind: 'max-open-sales-contracts', maximum: 3 } },
  { id: 'sales-capacity-3', chainId: 'sales-capacity', tier: 3, name: 'Sales Capacity III', cost: 4_000, durationMs: 180_000, requirements: [{ kind: 'research', projectId: 'sales-capacity-2', label: 'Sales Capacity II' }, CASH_TIER_1], effect: { kind: 'max-open-sales-contracts', maximum: 5 } },
  { id: 'sales-capacity-4', chainId: 'sales-capacity', tier: 4, name: 'Sales Capacity IV', cost: 9_000, durationMs: 360_000, requirements: [{ kind: 'research', projectId: 'sales-capacity-3', label: 'Sales Capacity III' }, PRESTIGE_TIER_1], effect: { kind: 'max-open-sales-contracts', maximum: 7 } },
  { id: 'sales-capacity-5', chainId: 'sales-capacity', tier: 5, name: 'Sales Capacity V', cost: 20_000, durationMs: 720_000, requirements: [{ kind: 'research', projectId: 'sales-capacity-4', label: 'Sales Capacity IV' }, CONTRACTS_TIER_2], effect: { kind: 'max-open-sales-contracts', maximum: 10 } },
  ...RECIPE_RESEARCH_PROJECTS,
];

export const RESEARCH_PROJECTS_BY_ID: Readonly<Record<ResearchProjectId, ResearchProjectDefinition>> = Object.fromEntries(
  RESEARCH_PROJECTS.map((project) => [project.id, project]),
) as Record<ResearchProjectId, ResearchProjectDefinition>;

export function getResearchProject(projectId: string): ResearchProjectDefinition | null {
  return (RESEARCH_PROJECTS_BY_ID as Record<string, ResearchProjectDefinition | undefined>)[projectId] ?? null;
}
