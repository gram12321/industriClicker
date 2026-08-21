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
  calculateSalesOrderInventoryValueReadiness,
  getOfferableSalesOrderResourceTypes,
  type SalesOrderAcquisitionDetails,
} from './salesOrders';
import { SALES_ORDER_MINIMUM_COMPANY_VALUE_CAP } from './salesConstants';

export type SalesOrderAcquisitionStatus = SalesOrderAcquisitionDetails & {
  hasOfferableResources: boolean;
  inventoryReadinessMultiplier: number;
  inventoryValue: number;
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
  const assets = calculateAssets({
    finance: input.finance,
    inventory: input.inventory,
    market: input.market,
    facilities: input.facilities,
    research: input.research,
  });
  const maximumOrderValue = Math.max(
    SALES_ORDER_MINIMUM_COMPANY_VALUE_CAP,
    assets.totalAssets * getSalesOrderMaximumCompanyValueFraction(completedResearchProjectIds),
  );
  const producedByResource = getProducedByResource(input.productionStatistics);
  const candidateResourceTypes = getSalesOfferResourceTypes(
    completedResearchProjectIds,
    producedByResource,
  );
  const offerableResources = getOfferableSalesOrderResourceTypes({
    candidateResourceTypes,
    globalPrices: Object.fromEntries(
      RESOURCE_TYPES.map((resourceType) => [resourceType, input.market.getGlobalPrice(resourceType)]),
    ) as Record<ResourceType, number>,
    maximumOrderValue,
  });
  const inventoryReadinessMultiplier = calculateSalesOrderInventoryValueReadiness(assets.inventory, maximumOrderValue);

  return {
    ...calculateSalesOrderAcquisitionDetails({
      openOrderCount: input.salesOrders.getOfferedOrders().length,
      maximumOpenOrders: getMaximumOpenSalesOrders(completedResearchProjectIds),
      companyPrestige: calculateCompanyPrestigeSummary(
        input.prestige.getEvents(),
        input.currentGameTimeMs,
      ).totalPrestige,
      economyPhase: input.finance.getEconomyPhase(),
      hasOfferableResources: offerableResources.length > 0,
      inventoryReadinessMultiplier,
    }),
    hasOfferableResources: offerableResources.length > 0,
    inventoryReadinessMultiplier,
    inventoryValue: assets.inventory,
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
