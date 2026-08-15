import { calculateAssets, type Finance } from '@/game/finance';
import type { FacilityCollection } from '@/game/facilities';
import type { Inventory } from '@/game/inventory';
import type { Market } from '@/game/market';
import { calculateCompanyPrestigeSummary, type PrestigeLedger } from '@/game/prestige';
import type { ProductionStatistics } from '@/game/achievements';
import {
  getSalesOfferProducedResourceWeight,
  getSalesOfferResourceTypes,
  getSalesOrderMaximumCompanyValueFraction,
  type ResearchLedger,
} from '@/game/research';
import { RESOURCE_TYPES, type ResourceType } from '@/game/resources';
import {
  SalesOrders,
  calculateSalesOrderAcquisitionDetails,
  getEligibleSalesOrderResourceTypes,
  type SalesOrderAcquisitionDetails,
} from './salesOrders';
import { SALES_ORDER_MINIMUM_COMPANY_VALUE_CAP } from './salesConstants';

export type SalesOrderAcquisitionStatus = SalesOrderAcquisitionDetails & {
  hasEligibleInventory: boolean;
  maximumOrderValue: number;
};

export type SalesOrderAcquisitionInput = {
  facilities: FacilityCollection;
  finance: Finance;
  inventory: Inventory;
  market: Market;
  productionStatistics: ProductionStatistics;
  prestige: PrestigeLedger;
  research: ResearchLedger;
  salesOrders: SalesOrders;
  currentGameTimeMs: number;
};

/** Provides the UI and simulation with one authoritative sales-offer eligibility state. */
export function getSalesOrderAcquisitionStatus(
  input: SalesOrderAcquisitionInput,
): SalesOrderAcquisitionStatus {
  const completedResearchProjectIds = input.research.getCompletedProjectIds();
  const maximumOrderValue = Math.max(
    SALES_ORDER_MINIMUM_COMPANY_VALUE_CAP,
    calculateAssets({
      finance: input.finance,
      inventory: input.inventory,
      market: input.market,
      facilities: input.facilities,
      research: input.research,
    }).totalAssets * getSalesOrderMaximumCompanyValueFraction(completedResearchProjectIds),
  );
  const producedByResource = input.productionStatistics.toSnapshot().producedByResource;
  const eligibleResources = getEligibleSalesOrderResourceTypes({
    candidateResourceTypes: getSalesOfferResourceTypes(
      completedResearchProjectIds,
      producedByResource,
    ),
    inventoryByResource: Object.fromEntries(
      RESOURCE_TYPES.map((resourceType) => [resourceType, input.inventory.getAmount(resourceType)]),
    ) as Record<ResourceType, number>,
    globalPrices: Object.fromEntries(
      RESOURCE_TYPES.map((resourceType) => [resourceType, input.market.getGlobalPrice(resourceType)]),
    ) as Record<ResourceType, number>,
    maximumOrderValue,
  });

  return {
    ...calculateSalesOrderAcquisitionDetails({
      openOrderCount: input.salesOrders.getOfferedOrders().length,
      companyPrestige: calculateCompanyPrestigeSummary(
        input.prestige.getEvents(),
        input.currentGameTimeMs,
      ).totalPrestige,
      economyPhase: input.finance.getEconomyPhase(),
      hasEligibleInventory: eligibleResources.length > 0,
    }),
    hasEligibleInventory: eligibleResources.length > 0,
    maximumOrderValue,
  };
}

/** Returns the current production-weight multiplier used by sales order generation. */
export function getSalesOrderResourceWeight(
  resourceType: ResourceType,
  research: ResearchLedger,
  productionStatistics: ProductionStatistics,
): number {
  return productionStatistics.toSnapshot().producedByResource[resourceType] > 0
    ? getSalesOfferProducedResourceWeight(research.getCompletedProjectIds())
    : 1;
}
