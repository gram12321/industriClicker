import type { Finance } from '@/game/finance/finance';
import type { FacilityCollection } from '@/game/facilities/facilityCollection';
import type { FacilityType } from '@/game/facilities/facilityTypes';
import type { FacilityUpgradeKind } from '@/game/facilities/facilityUpgrades';
import type { Inventory } from '@/game/inventory/inventory';
import type { Market, MarketAutomation } from '@/game/market';
import type { ResourceType } from '@/game/resources/resourceTypes';
import type { Recipe } from '@/game/recipes/recipeTypes';
import type { SalesContracts } from '@/game/sales/salesContracts';
import { CompanyView } from './CompanyView';
import { FinanceView } from './FinanceView';
import { InventoryView } from './InventoryView';
import { MarketView } from './MarketView';
import { ProductionView } from './ProductionView';
import { SalesView } from './SalesView';

export type GameViewId = 'company' | 'inventory' | 'market' | 'production' | 'research' | 'sales' | 'finance';

export function GameViewContent({
  activeTab,
  companyName,
  customerPipelineProgress,
  facilities,
  finance,
  fulfillSalesContract,
  inventory,
  market,
  maximumOpenContracts,
  buyMarketResource,
  sellMarketResource,
  setMarketAutomation,
  openConstructionYard,
  rejectSalesContract,
  requestFacilityDestruction,
  salesContracts,
  setFacilityRecipe,
  setFacilityProductionActive,
  setFacilityWorkers,
  upgradeFacility,
}: {
  activeTab: Exclude<GameViewId, 'research'>;
  companyName: string;
  customerPipelineProgress: number;
  facilities: FacilityCollection;
  finance: Finance;
  fulfillSalesContract: (contractId: string) => boolean;
  inventory: Inventory;
  market: Market;
  maximumOpenContracts: number;
  buyMarketResource: (resourceType: ResourceType, amount: number) => boolean;
  sellMarketResource: (resourceType: ResourceType, amount: number) => boolean;
  setMarketAutomation: (resourceType: ResourceType, updates: Partial<MarketAutomation>) => boolean;
  openConstructionYard: () => void;
  rejectSalesContract: (contractId: string) => boolean;
  requestFacilityDestruction: (facilityType: FacilityType) => void;
  salesContracts: SalesContracts;
  setFacilityRecipe: (facilityType: FacilityType, recipeName: Recipe['name'] | null) => boolean;
  setFacilityProductionActive: (facilityType: FacilityType, active: boolean) => boolean;
  setFacilityWorkers: (facilityType: FacilityType, workerCount: number) => boolean;
  upgradeFacility: (facilityType: FacilityType, upgradeKind: FacilityUpgradeKind) => boolean;
}) {
  switch (activeTab) {
    case 'company': return <CompanyView companyName={companyName} />;
    case 'inventory': return <InventoryView inventory={inventory} />;
    case 'market': return <MarketView buyMarketResource={buyMarketResource} finance={finance} inventory={inventory} market={market} sellMarketResource={sellMarketResource} setMarketAutomation={setMarketAutomation} />;
    case 'production': return <ProductionView buyMarketResource={buyMarketResource} facilities={facilities} finance={finance} inventory={inventory} market={market} openConstructionYard={openConstructionYard} requestFacilityDestruction={requestFacilityDestruction} setFacilityProductionActive={setFacilityProductionActive} setFacilityRecipe={setFacilityRecipe} setFacilityWorkers={setFacilityWorkers} setMarketAutomation={setMarketAutomation} upgradeFacility={upgradeFacility} />;
    case 'sales': return <SalesView customerPipelineProgress={customerPipelineProgress} fulfillSalesContract={fulfillSalesContract} inventory={inventory} maximumOpenContracts={maximumOpenContracts} rejectSalesContract={rejectSalesContract} salesContracts={salesContracts} />;
    case 'finance': return <FinanceView finance={finance} />;
  }
}

