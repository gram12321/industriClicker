import { calculateAssets, type Finance } from '@/game/finance';
import type { FacilityCollection } from '@/game/facilities';
import type { Inventory } from '@/game/inventory';
import type { Market } from '@/game/market';
import { calculateCompanyPrestigeSummary, type PrestigeLedger } from '@/game/prestige';
import {
  getMaximumOpenSalesOrders,
  getSalesOfferProducedResourceWeight,
  getSalesOfferResourceTypes,
  getSalesOrderMaximumCompanyValueFraction,
  type ResearchLedger,
} from '@/game/research';
import { RESOURCE_TYPES, type ResourceType } from '@/game/resources';
import {
  SalesOrders,
  calculateSalesOrderAcquisitionDetails,
  calculateSalesOrderInventoryReadiness,
  getEligibleSalesOrderResourceTypes,
  type SalesOrderAcquisitionDetails,
} from './salesOrders';
import { getSalesResourceProfile } from './salesCustomers';
import { SALES_ORDER_MINIMUM_COMPANY_VALUE_CAP } from './salesConstants';

export type SalesOrderAcquisitionStatus = SalesOrderAcquisitionDetails & {
  hasEligibleInventory: boolean;
  inventoryReadinessMultiplier: number;
  maximumOrderValue: number;
};

type ProductionStatisticsLike = {
  getLifetimeFacilityOutputByResource?: () => Readonly<Record<ResourceType, number>>;
  toSnapshot?: () => unknown;
};

function getProducedByResource(productionStatistics: ProductionStatisticsLike): Readonly<Record<ResourceType, number>> {
  const snapshot = productionStatistics.toSnapshot?.() as { producedByResource?: Readonly<Record<ResourceType, number>> } | undefined;
  return productionStatistics.getLifetimeFacilityOutputByResource?.()
    ?? snapshot?.producedByResource
    ?? Object.fromEntries(RESOURCE_TYPES.map((resourceType) => [resourceType, 0])) as Readonly<Record<ResourceType, number>>;
}

export type SalesOrderAcquisitionStatusInput = {
  facilities: FacilityCollection;
  finance: Finance;
  inventory: Inventory;
  market: Market;
  productionStatistics: ProductionStatisticsLike;
  prestige: PrestigeLedger;
  research: ResearchLedger;
  salesOrders: SalesOrders;
  currentGameTimeMs: number;
};

/** Provides the UI and simulation with one authoritative sales-offer eligibility state. */
export function getSalesOrderAcquisitionStatus(
  input: SalesOrderAcquisitionStatusInput,
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
  const producedByResource = getProducedByResource(input.productionStatistics);
  const candidateResourceTypes = getSalesOfferResourceTypes(
    completedResearchProjectIds,
    producedByResource,
  );
  const inventoryByResource = Object.fromEntries(
    RESOURCE_TYPES.map((resourceType) => [resourceType, input.inventory.getAmount(resourceType)]),
  ) as Record<ResourceType, number>;
  const inventoryReadinessMultiplier = Math.max(
    0,
    ...candidateResourceTypes.map((resourceType) => calculateSalesOrderInventoryReadiness(
      inventoryByResource[resourceType],
      getSalesResourceProfile(resourceType).standardOrderLot,
    )),
  );
  const eligibleResources = getEligibleSalesOrderResourceTypes({
    candidateResourceTypes,
    inventoryByResource,
    globalPrices: Object.fromEntries(
      RESOURCE_TYPES.map((resourceType) => [resourceType, input.market.getGlobalPrice(resourceType)]),
    ) as Record<ResourceType, number>,
    maximumOrderValue,
  });

  return {
    ...calculateSalesOrderAcquisitionDetails({
      openOrderCount: input.salesOrders.getOfferedOrders().length,
      maximumOpenOrders: getMaximumOpenSalesOrders(completedResearchProjectIds),
      companyPrestige: calculateCompanyPrestigeSummary(
        input.prestige.getEvents(),
        input.currentGameTimeMs,
      ).totalPrestige,
      economyPhase: input.finance.getEconomyPhase(),
      hasEligibleInventory: eligibleResources.length > 0,
      inventoryReadinessMultiplier,
    }),
    hasEligibleInventory: eligibleResources.length > 0,
    inventoryReadinessMultiplier,
    maximumOrderValue,
  };
}

/** Returns the current production-weight multiplier used by sales order generation. */
export function getSalesOrderResourceWeight(
  resourceType: ResourceType,
  research: ResearchLedger,
  productionStatistics: ProductionStatisticsLike,
): number {
  return getProducedByResource(productionStatistics)[resourceType] > 0
    ? getSalesOfferProducedResourceWeight(research.getCompletedProjectIds())
    : 1;
}
