import type { FacilityCollection } from '@/game/facilities';
import type { Market } from '@/game/market';
import { RESOURCE_GROUPS, RESOURCES, RESOURCE_TYPES, type ResourceGroup, type ResourceType } from '@/game/resources';
import {
  POPULATION_BASE_CONSUMPTION_PER_PERSON_PER_MINUTE,
  POPULATION_DOMAIN_ESSENTIALS,
  POPULATION_DOMAIN_MAX_SUBSTITUTION_PER_PAIR,
  POPULATION_DOMAIN_PRICE_ELASTICITY,
  POPULATION_MAX_SUBSTITUTION_PER_PAIR,
} from './populationConstants';

export type PopulationSnapshot = { householdBalance: number };

function emptyAmounts(): Record<ResourceType, number> {
  return Object.fromEntries(RESOURCE_TYPES.map((resourceType) => [resourceType, 0])) as Record<ResourceType, number>;
}

/** Aggregate household money owned by the current population. */
export class PopulationLedger {
  private householdBalance = 0;

  constructor(snapshot?: PopulationSnapshot) {
    if (snapshot && Number.isFinite(snapshot.householdBalance) && snapshot.householdBalance >= 0) this.householdBalance = snapshot.householdBalance;
  }

  getHouseholdBalance(): number { return this.householdBalance; }

  creditWages(amount: number): boolean {
    if (!Number.isFinite(amount) || amount <= 0) return false;
    this.householdBalance += amount;
    return true;
  }

  spendHouseholdCash(amount: number): boolean {
    if (!Number.isFinite(amount) || amount <= 0 || amount > this.householdBalance) return false;
    this.householdBalance -= amount;
    return true;
  }

  clone(): PopulationLedger { return new PopulationLedger(this.toSnapshot()); }
  toSnapshot(): PopulationSnapshot { return { householdBalance: this.householdBalance }; }
  static fromSnapshot(snapshot: PopulationSnapshot): PopulationLedger { return new PopulationLedger(snapshot); }
}

/** Population is every assigned facility worker, including staff in training. */
export function getPopulationCount(facilities: FacilityCollection): number {
  return facilities.getAll().reduce((total, facility) => total + facility.getView().assignedWorkers, 0);
}

export function getPopulationReferenceUnitPrice(resourceType: ResourceType): number {
  const definition = RESOURCES[resourceType].market;
  return definition.localBenchmarkSupply / definition.localInitialSupply;
}

function calculateCost(amounts: Readonly<Record<ResourceType, number>>, market: Market): number {
  return RESOURCE_TYPES.reduce((total, resourceType) => {
    const amount = amounts[resourceType];
    const quote = amount > 0 ? market.getLocalBuyQuote(resourceType, amount) : null;
    return total + (quote?.success ? quote.amount * quote.unitPrice : 0);
  }, 0);
}

function calculateGroupCosts(amounts: Readonly<Record<ResourceType, number>>, market: Market): Record<ResourceGroup, number> {
  const costs = Object.fromEntries(RESOURCE_GROUPS.map((group) => [group.id, 0])) as Record<ResourceGroup, number>;
  for (const group of RESOURCE_GROUPS) {
    for (const resourceType of group.resources) {
      const amount = amounts[resourceType];
      const quote = amount > 0 ? market.getLocalBuyQuote(resourceType, amount) : null;
      if (quote?.success) costs[group.id] += quote.amount * quote.unitPrice;
    }
  }
  return costs;
}

function calculateBaseAmounts(population: number): Record<ResourceType, number> {
  const amounts = emptyAmounts();
  for (const resourceType of RESOURCE_TYPES) {
    amounts[resourceType] = population * POPULATION_BASE_CONSUMPTION_PER_PERSON_PER_MINUTE[resourceType].amountPerPersonPerMinute;
  }
  return amounts;
}

function calculatePricePreferenceAmounts(baseAmounts: Readonly<Record<ResourceType, number>>, market: Market): Record<ResourceType, number> {
  const adjustedAmounts = { ...baseAmounts };
  const pendingTransfers: Array<{ from: ResourceType; to: ResourceType; amount: number }> = [];
  const outgoingAmounts = emptyAmounts();

  for (const group of RESOURCE_GROUPS) {
    const candidates = group.resources.filter((resourceType) => baseAmounts[resourceType] > 0);
    for (let firstIndex = 0; firstIndex < candidates.length; firstIndex += 1) {
      const first = candidates[firstIndex]!;
      for (let secondIndex = firstIndex + 1; secondIndex < candidates.length; secondIndex += 1) {
        const second = candidates[secondIndex]!;
        const currentRatio = market.getLocalPrice(first) / market.getLocalPrice(second);
        const referenceRatio = getPopulationReferenceUnitPrice(first) / getPopulationReferenceUnitPrice(second);
        const adjustment = 1 + (1 - currentRatio / referenceRatio);
        const from = adjustment < 1 ? first : second;
        const to = adjustment < 1 ? second : first;
        const fromElasticity = POPULATION_BASE_CONSUMPTION_PER_PERSON_PER_MINUTE[from].resourceElasticity;
        const toElasticity = POPULATION_BASE_CONSUMPTION_PER_PERSON_PER_MINUTE[to].resourceElasticity;
        const symmetricElasticity = Math.sqrt(fromElasticity * toElasticity);
        const transferShare = Math.min(Math.abs(adjustment - 1) * symmetricElasticity, POPULATION_MAX_SUBSTITUTION_PER_PAIR);
        const amount = Math.min(baseAmounts[first] * transferShare, baseAmounts[second] * transferShare);
        if (amount <= 0) continue;
        pendingTransfers.push({ from, to, amount });
        outgoingAmounts[from] += amount;
      }
    }
  }

  for (const transfer of pendingTransfers) {
    const normalization = outgoingAmounts[transfer.from] > baseAmounts[transfer.from]
      ? baseAmounts[transfer.from] / outgoingAmounts[transfer.from]
      : 1;
    const amount = transfer.amount * normalization;
    adjustedAmounts[transfer.from] -= amount;
    adjustedAmounts[transfer.to] += amount;
  }
  return adjustedAmounts;
}

function calculateDomainCost(amounts: Readonly<Record<ResourceType, number>>, group: { resources: readonly ResourceType[] }, market: Market, useReferencePrices: boolean): number {
  return group.resources.reduce((total, resourceType) => {
    const amount = amounts[resourceType];
    const unitPrice = useReferencePrices ? getPopulationReferenceUnitPrice(resourceType) : market.getLocalPrice(resourceType);
    return total + amount * unitPrice;
  }, 0);
}

/**
 * Shifts purchasing power between domains when one complete domain basket is
 * relatively expensive. Physical quantities are scaled by the resulting
 * domain-spending ratios; vertical substitution remains responsible for the
 * mix inside each domain.
 */
function calculateDomainPricePreferenceAmounts(amounts: Readonly<Record<ResourceType, number>>, market: Market): Record<ResourceType, number> {
  const adjustedAmounts = { ...amounts };
  const currentCosts = Object.fromEntries(RESOURCE_GROUPS.map((group) => [group.id, calculateDomainCost(amounts, group, market, false)])) as Record<ResourceGroup, number>;
  const referenceCosts = Object.fromEntries(RESOURCE_GROUPS.map((group) => [group.id, calculateDomainCost(amounts, group, market, true)])) as Record<ResourceGroup, number>;
  const targetCosts = { ...currentCosts };

  for (let firstIndex = 0; firstIndex < RESOURCE_GROUPS.length; firstIndex += 1) {
    const first = RESOURCE_GROUPS[firstIndex]!.id;
    for (let secondIndex = firstIndex + 1; secondIndex < RESOURCE_GROUPS.length; secondIndex += 1) {
      const second = RESOURCE_GROUPS[secondIndex]!.id;
      if (currentCosts[first] <= 0 || currentCosts[second] <= 0 || referenceCosts[first] <= 0 || referenceCosts[second] <= 0) continue;
      const currentRatio = currentCosts[first] / currentCosts[second];
      const referenceRatio = referenceCosts[first] / referenceCosts[second];
      const adjustment = 1 + (1 - currentRatio / referenceRatio);
      const from = adjustment < 1 ? first : second;
      const to = adjustment < 1 ? second : first;
      const essentiality = POPULATION_DOMAIN_ESSENTIALS[from];
      const transferShare = Math.min(
        Math.abs(adjustment - 1) * POPULATION_DOMAIN_PRICE_ELASTICITY * (1 - essentiality),
        POPULATION_DOMAIN_MAX_SUBSTITUTION_PER_PAIR,
      );
      const transferCost = Math.min(currentCosts[from] * transferShare, currentCosts[to] * transferShare);
      if (transferCost <= 0) continue;
      targetCosts[from] -= transferCost;
      targetCosts[to] += transferCost;
    }
  }

  for (const group of RESOURCE_GROUPS) {
    const currentCost = currentCosts[group.id];
    const targetCost = Math.max(0, targetCosts[group.id]);
    const scale = currentCost > 0 ? targetCost / currentCost : 0;
    for (const resourceType of group.resources) adjustedAmounts[resourceType] *= scale;
  }
  return adjustedAmounts;
}

function applyPreferenceWithinGroups(
  amounts: Readonly<Record<ResourceType, number>>,
  getWeight: (resourceType: ResourceType) => number,
): Record<ResourceType, number> {
  const adjustedAmounts = emptyAmounts();
  for (const group of RESOURCE_GROUPS) {
    const totalAmount = group.resources.reduce((total, resourceType) => total + amounts[resourceType], 0);
    const weightedAmount = group.resources.reduce((total, resourceType) => total + amounts[resourceType] * getWeight(resourceType), 0);
    const normalization = weightedAmount > 0 ? totalAmount / weightedAmount : 0;
    for (const resourceType of group.resources) adjustedAmounts[resourceType] = amounts[resourceType] * getWeight(resourceType) * normalization;
  }
  return adjustedAmounts;
}

function calculateBaselinePreferenceAmounts(pricePreferenceAmounts: Readonly<Record<ResourceType, number>>): Record<ResourceType, number> {
  return applyPreferenceWithinGroups(pricePreferenceAmounts, (resourceType) => {
    const { baselinePreference, resourceElasticity } = POPULATION_BASE_CONSUMPTION_PER_PERSON_PER_MINUTE[resourceType];
    return (1 - baselinePreference) ** resourceElasticity;
  });
}

function calculateAdjustedAmounts(baselinePreferenceAmounts: Readonly<Record<ResourceType, number>>): Record<ResourceType, number> {
  return applyPreferenceWithinGroups(baselinePreferenceAmounts, (resourceType) => {
    const { luxury, resourceElasticity } = POPULATION_BASE_CONSUMPTION_PER_PERSON_PER_MINUTE[resourceType];
    return (1 - luxury) ** resourceElasticity;
  });
}

function calculateBudgetScaledAmounts(adjustedAmounts: Readonly<Record<ResourceType, number>>, market: Market, budget: number): Record<ResourceType, number> {
  const fullCost = calculateCost(adjustedAmounts, market);
  if (budget >= fullCost) return { ...adjustedAmounts };
  let low = 0;
  let high = 1;
  for (let iteration = 0; iteration < 28; iteration += 1) {
    const scale = (low + high) / 2;
    const scaledAmounts = Object.fromEntries(RESOURCE_TYPES.map((resourceType) => [resourceType, adjustedAmounts[resourceType] * scale])) as Record<ResourceType, number>;
    if (calculateCost(scaledAmounts, market) <= budget) low = scale;
    else high = scale;
  }
  return Object.fromEntries(RESOURCE_TYPES.map((resourceType) => [resourceType, adjustedAmounts[resourceType] * low])) as Record<ResourceType, number>;
}

/**
 * Price, baseline, and luxury preferences form the adjusted basket. Budget
 * scaling then determines the actual affordable purchase.
 */
export function calculatePopulationConsumption(population: number, market: Market, budgetPerMinute = 0) {
  const safePopulation = Number.isFinite(population) ? Math.max(0, Math.floor(population)) : 0;
  const safeBudget = Number.isFinite(budgetPerMinute) ? Math.max(0, budgetPerMinute) : 0;
  const baseAmounts = calculateBaseAmounts(safePopulation);
  const verticalPricePreferenceAmounts = calculatePricePreferenceAmounts(baseAmounts, market);
  const pricePreferenceAmounts = calculateDomainPricePreferenceAmounts(verticalPricePreferenceAmounts, market);
  const pricePreferenceCost = calculateCost(pricePreferenceAmounts, market);
  const isScarce = safeBudget < pricePreferenceCost;
  const baselinePreferenceAmounts = isScarce ? calculateBaselinePreferenceAmounts(pricePreferenceAmounts) : { ...pricePreferenceAmounts };
  const adjustedAmounts = isScarce ? calculateAdjustedAmounts(baselinePreferenceAmounts) : { ...pricePreferenceAmounts };
  const actualAmounts = calculateBudgetScaledAmounts(adjustedAmounts, market, safeBudget);
  const actualSpendingByGroup = calculateGroupCosts(actualAmounts, market);
  const actualSpendingPerMinute = Object.values(actualSpendingByGroup).reduce((total, amount) => total + amount, 0);
  return { baseAmounts, pricePreferenceAmounts, baselinePreferenceAmounts, adjustedAmounts, actualAmounts, actualSpendingByGroup, actualSpendingPerMinute };
}

/** Settles the proportional share of the selected per-minute basket for one foreground step. */
export function settlePopulationLocalMarketDemand(input: { facilities: FacilityCollection; market: Market; population: PopulationLedger; stepMs: number }): { market: Market; population: PopulationLedger } {
  const count = getPopulationCount(input.facilities);
  if (count <= 0 || input.population.getHouseholdBalance() <= 0) return { market: input.market, population: input.population };
  const perMinuteWages = calculatePopulationTotalWagePayoutPerMinute(input.facilities);
  const budgetPerMinute = input.population.getHouseholdBalance() + perMinuteWages;
  const consumption = calculatePopulationConsumption(count, input.market, budgetPerMinute);
  if (consumption.actualSpendingPerMinute <= 0) return { market: input.market, population: input.population };
  const market = input.market.clone();
  const population = input.population.clone();
  const stepScale = Math.max(0, input.stepMs / 60_000);
  for (const resourceType of RESOURCE_TYPES) {
    const amount = consumption.actualAmounts[resourceType] * stepScale;
    if (amount <= 0) continue;
    const quote = market.getLocalBuyQuote(resourceType, amount);
    const cost = quote.success ? quote.amount * quote.unitPrice : 0;
    if (!quote.success || cost <= 0 || !population.spendHouseholdCash(cost)) continue;
    market.buyFromLocal(resourceType, amount);
  }
  return { market, population };
}

export function calculatePopulationTotalWagePayoutPerMinute(facilities: FacilityCollection): number {
  return facilities.getAll().reduce((total, facility) => {
    const view = facility.getView();
    return total + Math.max(0, view.assignedWorkers) * Math.max(0, view.staffWagePerWorkerPerMinute);
  }, 0);
}
