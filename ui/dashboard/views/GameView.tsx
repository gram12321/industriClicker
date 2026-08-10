import type { Finance } from '@/game/finance';
import type { AchievementLedger } from '@/game/achievements';
import type { LoanOffer } from '@/game/finance';
import type { LoanSearchCriteria } from '@/game/finance';
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
import { ProductionView } from './FacilityView';
import { SalesView } from './SalesView';

export type GameViewId = 'company' | 'inventory' | 'market' | 'production' | 'research' | 'sales' | 'finance';

export function GameViewContent({
  activeTab,
  achievements,
  companyStartedAtGameTimeMs,
  currentGameTimeMs,
  companyName,
  customerPipelineProgress,
  facilities,
  finance,
  fulfillSalesContract,
  inventory,
  market,
  onAcceptLoanOffer,
  onExtraLoanPayment,
  onRepayLoanInFull,
  onStartLoanSearch,
  maximumOpenContracts,
  onlyInStock,
  showActiveRecipeInputs,
  buyMarketResource,
  sellMarketResource,
  setMarketAutomation,
  setOnlyInStock,
  setShowActiveRecipeInputs,
  openConstructionYard,
  isBuildFacilityTutorial,
  onBuildFacilityLayout,
  rejectSalesContract,
  research,
  getResearchAvailability,
  requestFacilityDestruction,
  salesContracts,
  setFacilityRecipe,
  setFacilityProductionActive,
  setFacilityWorkers,
  repairFacility,
  startResearch,
  upgradeFacility,
}: {
  activeTab: Exclude<GameViewId, 'research'>;
  achievements: AchievementLedger;
  companyStartedAtGameTimeMs: number;
  currentGameTimeMs: number;
  companyName: string;
  customerPipelineProgress: number;
  facilities: FacilityCollection;
  finance: Finance;
  fulfillSalesContract: (contractId: string) => boolean;
  inventory: Inventory;
  market: Market;
  onAcceptLoanOffer: (offer: LoanOffer) => boolean;
  onExtraLoanPayment: (loanId: string) => { success: boolean; reason?: string };
  onRepayLoanInFull: (loanId: string) => { success: boolean; reason?: string };
  onStartLoanSearch: (criteria: LoanSearchCriteria) => { success: boolean; reason?: string };
  maximumOpenContracts: number;
  onlyInStock: boolean;
  showActiveRecipeInputs: boolean;
  buyMarketResource: (resourceType: ResourceType, amount: number) => boolean;
  sellMarketResource: (resourceType: ResourceType, amount: number) => boolean;
  setMarketAutomation: (resourceType: ResourceType, updates: Partial<MarketAutomation>) => boolean;
  setOnlyInStock: (value: boolean) => void;
  setShowActiveRecipeInputs: (value: boolean) => void;
  openConstructionYard: () => void;
  isBuildFacilityTutorial?: boolean;
  onBuildFacilityLayout?: (layout: { height: number; width: number; x: number; y: number }) => void;
  rejectSalesContract: (contractId: string) => boolean;
  research: ResearchLedger;
  getResearchAvailability: (projectId: ResearchProjectId) => ResearchAvailability;
  requestFacilityDestruction: (facilityId: string) => void;
  salesContracts: SalesContracts;
  setFacilityRecipe: (facilityId: string, recipeName: Recipe['name'] | null) => boolean;
  setFacilityProductionActive: (facilityId: string, active: boolean) => boolean;
  setFacilityWorkers: (facilityId: string, workerCount: number) => boolean;
  repairFacility: (facilityId: string) => boolean;
  startResearch: (projectId: ResearchProjectId) => boolean;
  upgradeFacility: (facilityId: string, upgradeKind: FacilityUpgradeKind) => boolean;
}) {
  switch (activeTab) {
    case 'company': return <CompanyView companyName={companyName} />;
    case 'inventory':
    case 'market': return <InventoryView buyMarketResource={buyMarketResource} facilities={facilities} finance={finance} inventory={inventory} market={market} onlyInStock={onlyInStock} showActiveRecipeInputs={showActiveRecipeInputs} sellMarketResource={sellMarketResource} setMarketAutomation={setMarketAutomation} setOnlyInStock={setOnlyInStock} setShowActiveRecipeInputs={setShowActiveRecipeInputs} />;
    case 'production': return <ProductionView buyMarketResource={buyMarketResource} facilities={facilities} finance={finance} getResearchAvailability={getResearchAvailability} inventory={inventory} market={market} research={research} startResearch={startResearch} isBuildFacilityTutorial={isBuildFacilityTutorial} onBuildFacilityLayout={onBuildFacilityLayout} openConstructionYard={openConstructionYard} repairFacility={repairFacility} requestFacilityDestruction={requestFacilityDestruction} setFacilityProductionActive={setFacilityProductionActive} setFacilityRecipe={setFacilityRecipe} setFacilityWorkers={setFacilityWorkers} setMarketAutomation={setMarketAutomation} upgradeFacility={upgradeFacility} />;
    case 'sales': return <SalesView customerPipelineProgress={customerPipelineProgress} fulfillSalesContract={fulfillSalesContract} getResearchAvailability={getResearchAvailability} inventory={inventory} market={market} maximumOpenContracts={maximumOpenContracts} rejectSalesContract={rejectSalesContract} research={research} salesContracts={salesContracts} />;
    case 'finance': return <FinanceView achievements={achievements} companyStartedAtGameTimeMs={companyStartedAtGameTimeMs} currentGameTimeMs={currentGameTimeMs} facilities={facilities} finance={finance} inventory={inventory} market={market} onAcceptLoanOffer={onAcceptLoanOffer} onExtraPayment={onExtraLoanPayment} onRepayInFull={onRepayLoanInFull} onStartLoanSearch={onStartLoanSearch} research={research} />;
  }
}

