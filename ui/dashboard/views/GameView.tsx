import type { Finance } from '@/game/finance';
import type { FacilityCollection } from '@/game/facilities/facilityCollection';
import type { FacilityUpgradeKind } from '@/game/facilities/facilityUpgrades';
import type { Inventory } from '@/game/inventory';
import type { Market, MarketAutomation } from '@/game/market';
import type { ResourceType } from '@/game/resources/resourceTypes';
import type { Recipe } from '@/game/recipes/recipeTypes';
import type { ResearchLedger, ResearchProjectId } from '@/game/research';
import type { ResearchAvailability } from '@/game/core/stores';
import type { SalesContracts } from '@/game/sales';
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
  research,
  getResearchAvailability,
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
  research: ResearchLedger;
  getResearchAvailability: (projectId: ResearchProjectId) => ResearchAvailability;
  requestFacilityDestruction: (facilityId: string) => void;
  salesContracts: SalesContracts;
  setFacilityRecipe: (facilityId: string, recipeName: Recipe['name'] | null) => boolean;
  setFacilityProductionActive: (facilityId: string, active: boolean) => boolean;
  setFacilityWorkers: (facilityId: string, workerCount: number) => boolean;
  upgradeFacility: (facilityId: string, upgradeKind: FacilityUpgradeKind) => boolean;
}) {
  switch (activeTab) {
    case 'company': return <CompanyView companyName={companyName} />;
    case 'inventory': return <InventoryView inventory={inventory} />;
    case 'market': return <MarketView buyMarketResource={buyMarketResource} finance={finance} inventory={inventory} market={market} sellMarketResource={sellMarketResource} setMarketAutomation={setMarketAutomation} />;
    case 'production': return <ProductionView buyMarketResource={buyMarketResource} facilities={facilities} finance={finance} inventory={inventory} market={market} openConstructionYard={openConstructionYard} requestFacilityDestruction={requestFacilityDestruction} setFacilityProductionActive={setFacilityProductionActive} setFacilityRecipe={setFacilityRecipe} setFacilityWorkers={setFacilityWorkers} setMarketAutomation={setMarketAutomation} upgradeFacility={upgradeFacility} />;
    case 'sales': return <SalesView customerPipelineProgress={customerPipelineProgress} fulfillSalesContract={fulfillSalesContract} getResearchAvailability={getResearchAvailability} inventory={inventory} market={market} maximumOpenContracts={maximumOpenContracts} rejectSalesContract={rejectSalesContract} research={research} salesContracts={salesContracts} />;
    case 'finance': return <FinanceView finance={finance} />;
  }
}

