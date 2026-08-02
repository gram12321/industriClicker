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

export type GameViewId = 'company' | 'inventory' | 'market' | 'production' | 'sales' | 'finance';

export function GameViewContent({
  activeTab,
  companyName,
  customerPipelineProgress,
  facilities,
  finance,
  fulfillSalesContract,
  inventory,
  market,
  buyMarketResource,
  sellMarketResource,
  setMarketAutomation,
  openConstructionYard,
  rejectSalesContract,
  requestFacilityDestruction,
  salesContracts,
  setFacilityRecipe,
  setFacilityWorkers,
  upgradeFacility,
}: {
  activeTab: GameViewId;
  companyName: string;
  customerPipelineProgress: number;
  facilities: FacilityCollection;
  finance: Finance;
  fulfillSalesContract: (contractId: string) => boolean;
  inventory: Inventory;
  market: Market;
  buyMarketResource: (resourceType: ResourceType, amount: number) => boolean;
  sellMarketResource: (resourceType: ResourceType, amount: number) => boolean;
  setMarketAutomation: (resourceType: ResourceType, updates: Partial<MarketAutomation>) => boolean;
  openConstructionYard: () => void;
  rejectSalesContract: (contractId: string) => boolean;
  requestFacilityDestruction: (facilityType: FacilityType) => void;
  salesContracts: SalesContracts;
  setFacilityRecipe: (facilityType: FacilityType, recipeName: Recipe['name'] | null) => boolean;
  setFacilityWorkers: (facilityType: FacilityType, workerCount: number) => boolean;
  upgradeFacility: (facilityType: FacilityType, upgradeKind: FacilityUpgradeKind) => boolean;
}) {
  switch (activeTab) {
    case 'company': return <CompanyView companyName={companyName} />;
    case 'inventory': return <InventoryView inventory={inventory} />;
    case 'market': return <MarketView buyMarketResource={buyMarketResource} finance={finance} inventory={inventory} market={market} sellMarketResource={sellMarketResource} setMarketAutomation={setMarketAutomation} />;
    case 'production': return <ProductionView facilities={facilities} finance={finance} inventory={inventory} openConstructionYard={openConstructionYard} requestFacilityDestruction={requestFacilityDestruction} setFacilityRecipe={setFacilityRecipe} setFacilityWorkers={setFacilityWorkers} upgradeFacility={upgradeFacility} />;
    case 'sales': return <SalesView customerPipelineProgress={customerPipelineProgress} fulfillSalesContract={fulfillSalesContract} inventory={inventory} rejectSalesContract={rejectSalesContract} salesContracts={salesContracts} />;
    case 'finance': return <FinanceView finance={finance} />;
  }
}

