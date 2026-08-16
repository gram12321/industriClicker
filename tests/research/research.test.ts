import { describe, expect, it } from 'vitest';
import { ACHIEVEMENT_DEFINITIONS } from '@/game/achievements';
import { FACILITIES } from '@/game/facilities';
import { RESOURCE_TYPES, ResourceType } from '@/game/resources';
import { BASE_MAXIMUM_OPEN_SALES_ORDERS, getLocalMarketDepthMultiplier, getLocalRegionalDiffusionMultiplier, getMaximumOpenSalesOrders, getRecipeResearchProjectId, getResearchProject, getResourceProductionQuality, getResourceProductionQualityLevel, getResourceQualityResearchProjectId, getSalesOrderBidMultiplier, getSalesOrderBundleMaturityMultiplier, getSalesOrderMaximumCompanyValueFraction, getSalesOrderMinimumPremiumBonus, getSalesOfferProducedResourceWeight, getSalesOfferResourceTypes, getSalesPressureOfferChanceMultiplier, getSalesRelationshipDecayHalfLifeMultiplier, getSalesRelationshipFailureLossMultiplier, getSalesRelationshipFulfilmentGainMultiplier, RESEARCH_PROJECTS, ResearchLedger } from '@/game/research';

function createProductionTotals(produced: readonly ResourceType[]): Record<ResourceType, number> {
  return RESOURCE_TYPES.reduce((totals, resourceType) => {
    totals[resourceType] = produced.includes(resourceType) ? 1 : 0;
    return totals;
  }, {} as Record<ResourceType, number>);
}

describe('sales research effects', () => {
  it('starts with two open order slots and raises the first researched capacity to three', () => {
    expect(BASE_MAXIMUM_OPEN_SALES_ORDERS).toBe(2);
    expect(getMaximumOpenSalesOrders(['sales-capacity-1'])).toBe(3);
  });

  it('raises order rewards without changing the base market-sale premium', () => {
    expect(getSalesOrderBidMultiplier([], 1.2)).toBe(1.2);
    expect(getSalesOrderBidMultiplier(['bid-value-3'], 1.2)).toBe(1.35);
    expect(getSalesOrderBidMultiplier(['bid-value-3', 'bid-value-5'], 1.2)).toBe(1.5);
  });

  it('raises the maximum customer-order value from a conservative share of company assets', () => {
    expect(getSalesOrderMaximumCompanyValueFraction([])).toBe(0.5);
    expect(getSalesOrderMaximumCompanyValueFraction(['sales-order-value-limit-1'])).toBe(0.75);
    expect(getSalesOrderMaximumCompanyValueFraction(['sales-order-value-limit-1', 'sales-order-value-limit-5'])).toBe(4);
  });

  it('limits fully targeted offers to resources the company has produced', () => {
    const totals = createProductionTotals([ResourceType.Grain, ResourceType.Water]);

    expect(getSalesOfferResourceTypes(['sales-targeting-5'], totals)).toEqual([ResourceType.Grain, ResourceType.Water]);
    expect(getSalesOfferResourceTypes(['sales-targeting-5'], createProductionTotals([]))).toEqual(RESOURCE_TYPES);
  });

  it('uses the highest completed local market network tier as the market-depth multiplier', () => {
    expect(getLocalMarketDepthMultiplier([])).toBe(1);
    expect(getLocalMarketDepthMultiplier(['local-market-network-1', 'local-market-network-10'])).toBe(8);
  });

  it('caps the market diffusion network at a fourfold local-regional rate', () => {
    expect(getLocalRegionalDiffusionMultiplier([])).toBe(1);
    expect(getLocalRegionalDiffusionMultiplier(['market-diffusion-network-1', 'market-diffusion-network-10'])).toBe(4);
  });

  it('applies relationship-management multipliers with best completed tier effects', () => {
    expect(getSalesRelationshipDecayHalfLifeMultiplier([])).toBe(1);
    expect(getSalesRelationshipDecayHalfLifeMultiplier(['relationship-management-1', 'relationship-management-4'])).toBe(1.25);
    expect(getSalesRelationshipFulfilmentGainMultiplier(['relationship-management-2'])).toBe(1.08);
    expect(getSalesRelationshipFailureLossMultiplier(['relationship-management-3', 'relationship-management-5'])).toBe(0.8);
  });

  it('applies sales-intelligence multipliers with bounded pressure and premium improvements', () => {
    expect(getSalesPressureOfferChanceMultiplier([])).toBe(1);
    expect(getSalesPressureOfferChanceMultiplier(['sales-intelligence-1'])).toBe(0.9);
    expect(getSalesOrderBundleMaturityMultiplier(['sales-intelligence-2', 'sales-intelligence-4'])).toBe(1.2);
    expect(getSalesOrderMinimumPremiumBonus(['sales-intelligence-3', 'sales-intelligence-5'])).toBe(0.08);
  });
});

describe('simultaneous research ledger', () => {
  it('keeps concurrent projects independently visible and cancellable by project id', () => {
    const ledger = new ResearchLedger();
    ledger.start('sales-capacity-1', 50, 30_000);
    ledger.start('bid-value-1', 100, 60_000);

    expect(ledger.getActiveProjects().map((project) => project.projectId)).toEqual(['sales-capacity-1', 'bid-value-1']);
    expect(ledger.cancel('bid-value-1')).toMatchObject({ projectId: 'bid-value-1', paidCost: 100 });
    expect(ledger.getActiveProjects().map((project) => project.projectId)).toEqual(['sales-capacity-1']);
  });
});

describe('resource-quality research', () => {
  it('generates an unlimited next project and approaches Q100 with diminishing gains', () => {
    const firstProjectId = getResourceQualityResearchProjectId(ResourceType.Grain, 1);
    const secondProjectId = getResourceQualityResearchProjectId(ResourceType.Grain, 2);
    const distantProjectId = getResourceQualityResearchProjectId(ResourceType.Grain, 1_000);
    const first = getResearchProject(firstProjectId)!;
    const second = getResearchProject(secondProjectId)!;
    const distant = getResearchProject(distantProjectId)!;

    expect(first.effect).toMatchObject({ kind: 'resource-production-quality', resourceType: ResourceType.Grain, level: 1, quality: 2 });
    expect(second.cost).toBeGreaterThan(first.cost);
    expect(second.durationMs).toBeGreaterThan(first.durationMs);
    expect((second.effect as Extract<typeof second.effect, { kind: 'resource-production-quality' }>).quality).toBeGreaterThan(2);
    expect((distant.effect as Extract<typeof distant.effect, { kind: 'resource-production-quality' }>).quality).toBeLessThan(100);
  });

  it('uses the highest completed resource-quality level for new production', () => {
    const completed = [getResourceQualityResearchProjectId(ResourceType.Grain, 1), getResourceQualityResearchProjectId(ResourceType.Grain, 2)];

    expect(getResourceProductionQualityLevel(ResourceType.Grain, completed)).toBe(2);
    expect(getResourceProductionQuality(ResourceType.Grain, completed)).toBeGreaterThan(2);
    expect(getResourceProductionQuality(ResourceType.Bread, completed)).toBe(1);
  });
});

describe('catalogue progression coverage', () => {
  it('gives every facility recipe an unlock project and every produced resource a production achievement series', () => {
    const recipes = Object.values(FACILITIES).flatMap((facility) => facility.recipes);
    const researchProjectIds = new Set(RESEARCH_PROJECTS.map((project) => project.id));
    const producedResources = new Set(recipes.flatMap((recipe) => recipe.outputs).map((output) => output.resourceType));
    const achievementResources = new Set(ACHIEVEMENT_DEFINITIONS
      .filter((definition) => definition.metric === 'resource-produced')
      .map((definition) => definition.resourceType));

    for (const recipe of recipes) {
      expect(researchProjectIds).toContain(getRecipeResearchProjectId(recipe.name));
    }
    for (const resourceType of producedResources) {
      expect(achievementResources).toContain(resourceType);
    }
  });

  it('applies the threefold duration multiplier to every recipe research project', () => {
    const recipeProjects = RESEARCH_PROJECTS.filter((project) => project.effect.kind === 'recipe-unlock' || project.effect.kind === 'recipe-work-speed-bonus');

    expect(recipeProjects).not.toHaveLength(0);
    expect(recipeProjects.every((project) => project.durationMs >= 45_000)).toBe(true);
  });
});
