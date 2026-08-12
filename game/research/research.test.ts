import { describe, expect, it } from 'vitest';
import { RESOURCE_TYPES, ResourceType } from '@/game/resources';
import { SalesContracts } from '@/game/sales';
import { BASE_MAXIMUM_OPEN_SALES_CONTRACTS, getLocalMarketDepthMultiplier, getLocalRegionalDiffusionMultiplier, getMaximumOpenSalesContracts, getSalesContractPremiumMultiplier, getSalesOfferProducedResourceWeight, getSalesOfferResourceTypes } from './research';

function createProductionTotals(produced: readonly ResourceType[]): Record<ResourceType, number> {
  return RESOURCE_TYPES.reduce((totals, resourceType) => {
    totals[resourceType] = produced.includes(resourceType) ? 1 : 0;
    return totals;
  }, {} as Record<ResourceType, number>);
}

describe('sales research effects', () => {
  it('starts with two open contract slots and raises the first researched capacity to three', () => {
    expect(BASE_MAXIMUM_OPEN_SALES_CONTRACTS).toBe(2);
    expect(getMaximumOpenSalesContracts(['sales-capacity-1'])).toBe(3);
  });

  it('raises contract rewards without changing the base market-sale premium', () => {
    expect(getSalesContractPremiumMultiplier([], 1.2)).toBe(1.2);
    expect(getSalesContractPremiumMultiplier(['contract-value-3'], 1.2)).toBe(1.35);
    expect(getSalesContractPremiumMultiplier(['contract-value-3', 'contract-value-5'], 1.2)).toBe(1.5);
  });

  it('limits fully targeted offers to resources the company has produced', () => {
    const totals = createProductionTotals([ResourceType.Grain, ResourceType.Water]);

    expect(getSalesOfferResourceTypes(['sales-targeting-5'], totals)).toEqual([ResourceType.Grain, ResourceType.Water]);
    expect(getSalesOfferResourceTypes(['sales-targeting-5'], createProductionTotals([]))).toEqual(RESOURCE_TYPES);
  });

  it('weights produced resources when generating a sales offer', () => {
    const contracts = new SalesContracts();
    const rolls = [0, 0.5, 0];
    const random = () => rolls.shift() ?? 0;
    const producedResources = new Set<ResourceType>([ResourceType.Grain]);

    contracts.advanceTime(1, [ResourceType.Grain, ResourceType.Bread], () => 1, 2, random, (resourceType) => producedResources.has(resourceType) ? getSalesOfferProducedResourceWeight(['sales-targeting-1']) : 1);

    expect(contracts.getOfferedContracts()).toHaveLength(1);
    expect(contracts.getOfferedContracts()[0].resourceType).toBe(ResourceType.Grain);
  });

  it('uses the highest completed local market network tier as the market-depth multiplier', () => {
    expect(getLocalMarketDepthMultiplier([])).toBe(1);
    expect(getLocalMarketDepthMultiplier(['local-market-network-1', 'local-market-network-10'])).toBe(8);
  });

  it('caps the market diffusion network at a fourfold local-regional rate', () => {
    expect(getLocalRegionalDiffusionMultiplier([])).toBe(1);
    expect(getLocalRegionalDiffusionMultiplier(['market-diffusion-network-1', 'market-diffusion-network-10'])).toBe(4);
  });
});
