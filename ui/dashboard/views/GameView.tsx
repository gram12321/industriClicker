import type { Finance } from '@/game/finance';
import type { AchievementLedger } from '@/game/achievements';
import type { LoanOffer } from '@/game/finance';
import type { LoanSearchCriteria } from '@/game/finance';
import type { FacilityCollection } from '@/game/facilities/facilityCollection';
import type { FacilityUpgradeKind } from '@/game/facilities/facilityUpgrades';
import type { Inventory } from '@/game/inventory';
import type { ResourceFlowLedger } from '@/game/inventory';
import type { Market, MarketAutomation } from '@/game/market';
import type { ResourceType } from '@/game/resources/resourceTypes';
import type { Recipe } from '@/game/recipes/recipeTypes';
import type { ResearchLedger, ResearchProjectId } from '@/game/research';
import type { ResearchAvailability, SalesOrderAcquisitionStatus } from '@/game/core/stores';
import type { SalesOrders } from '@/game/sales';
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
  companyPrestige,
  currentGameTimeMs,
  companyName,
  customerPipelineProgress,
  facilities,
  finance,
  firstFacilityTutorialFocus,
  fulfillSalesOrder,
  inventory,
  resourceFlow,
  market,
  onAcceptLoanOffer,
  onRemoveLoanOffer,
  onRemoveUnavailableLoanOffers,
  onExtraLoanPayment,
  onRepayLoanInFull,
  onStartLoanSearch,
  maximumOpenOrders,
  onlyInStock,
  showActiveRecipeInputs,
  buyMarketResource,
  sellMarketResource,
  setMarketAutomation,
  setOnlyInStock,
  setShowActiveRecipeInputs,
  openConstructionYard,
  isBuildFacilityTutorial,
  isFirstFacilityTutorial,
  isProductionTutorial,
  onBuildFacilityLayout,
  onCompanyOverviewLayout,
  onFirstFacilityFocusLayout,
  rejectSalesOrder,
  research,
  getResearchAvailability,
  requestFacilityDestruction,
  salesOrderAcquisition,
  salesOrders,
  setFacilityProductionCycle,
  setFacilityProductionActive,
  setFacilityWorkers,
  repairFacility,
  startResearch,
  upgradeFacility,
}: {
  activeTab: Exclude<GameViewId, 'research'>;
  achievements: AchievementLedger;
  companyStartedAtGameTimeMs: number;
  companyPrestige: number;
  currentGameTimeMs: number;
  companyName: string;
  customerPipelineProgress: number;
  facilities: FacilityCollection;
  finance: Finance;
  firstFacilityTutorialFocus?: 'header' | 'efficiency' | null;
  fulfillSalesOrder: (orderId: string) => boolean;
  inventory: Inventory;
  resourceFlow: ResourceFlowLedger;
  market: Market;
  onAcceptLoanOffer: (offer: LoanOffer) => boolean;
  onRemoveLoanOffer: (offerId: string) => boolean;
  onRemoveUnavailableLoanOffers: () => number;
  onExtraLoanPayment: (loanId: string) => { success: boolean; reason?: string };
  onRepayLoanInFull: (loanId: string) => { success: boolean; reason?: string };
  onStartLoanSearch: (criteria: LoanSearchCriteria) => { success: boolean; reason?: string };
  maximumOpenOrders: number;
  onlyInStock: boolean;
  showActiveRecipeInputs: boolean;
  buyMarketResource: (resourceType: ResourceType, amount: number) => boolean;
  sellMarketResource: (resourceType: ResourceType, amount: number) => boolean;
  setMarketAutomation: (resourceType: ResourceType, updates: Partial<MarketAutomation>) => boolean;
  setOnlyInStock: (value: boolean) => void;
  setShowActiveRecipeInputs: (value: boolean) => void;
  openConstructionYard: () => void;
  isBuildFacilityTutorial?: boolean;
  isFirstFacilityTutorial?: boolean;
  isProductionTutorial?: boolean;
  onBuildFacilityLayout?: (layout: { height: number; width: number; x: number; y: number }) => void;
  onCompanyOverviewLayout?: (layout: { height: number; width: number; x: number; y: number }) => void;
  onFirstFacilityFocusLayout?: (layout: { height: number; width: number; x: number; y: number }) => void;
  rejectSalesOrder: (orderId: string) => boolean;
  research: ResearchLedger;
  getResearchAvailability: (projectId: ResearchProjectId) => ResearchAvailability;
  requestFacilityDestruction: (facilityId: string) => void;
  salesOrderAcquisition: SalesOrderAcquisitionStatus;
  salesOrders: SalesOrders;
  setFacilityProductionCycle: (facilityId: string, recipeNames: readonly Recipe['name'][]) => boolean;
  setFacilityProductionActive: (facilityId: string, active: boolean) => boolean;
  setFacilityWorkers: (facilityId: string, workerCount: number) => boolean;
  repairFacility: (facilityId: string) => boolean;
  startResearch: (projectId: ResearchProjectId) => boolean;
  upgradeFacility: (facilityId: string, upgradeKind: FacilityUpgradeKind) => boolean;
}) {
  switch (activeTab) {
    case 'company': return <CompanyView companyName={companyName} onCompanyOverviewLayout={onCompanyOverviewLayout} />;
    case 'inventory':
    case 'market': return <InventoryView buyMarketResource={buyMarketResource} currentGameTimeMs={currentGameTimeMs} facilities={facilities} finance={finance} inventory={inventory} market={market} onlyInStock={onlyInStock} resourceFlow={resourceFlow} showActiveRecipeInputs={showActiveRecipeInputs} sellMarketResource={sellMarketResource} setMarketAutomation={setMarketAutomation} setOnlyInStock={setOnlyInStock} setShowActiveRecipeInputs={setShowActiveRecipeInputs} />;
    case 'production': return <ProductionView buyMarketResource={buyMarketResource} facilities={facilities} finance={finance} firstFacilityTutorialFocus={firstFacilityTutorialFocus} getResearchAvailability={getResearchAvailability} inventory={inventory} market={market} research={research} startResearch={startResearch} isBuildFacilityTutorial={isBuildFacilityTutorial} isFirstFacilityTutorial={isFirstFacilityTutorial} isProductionTutorial={isProductionTutorial} onBuildFacilityLayout={onBuildFacilityLayout} onFirstFacilityFocusLayout={onFirstFacilityFocusLayout} openConstructionYard={openConstructionYard} repairFacility={repairFacility} requestFacilityDestruction={requestFacilityDestruction} setFacilityProductionActive={setFacilityProductionActive} setFacilityProductionCycle={setFacilityProductionCycle} setFacilityWorkers={setFacilityWorkers} setMarketAutomation={setMarketAutomation} upgradeFacility={upgradeFacility} />;
    case 'sales': return <SalesView companyPrestige={companyPrestige} customerPipelineProgress={customerPipelineProgress} currentGameTimeMs={currentGameTimeMs} economyPhase={finance.getEconomyPhase()} fulfillSalesOrder={fulfillSalesOrder} getResearchAvailability={getResearchAvailability} inventory={inventory} market={market} maximumOpenOrders={maximumOpenOrders} rejectSalesOrder={rejectSalesOrder} research={research} salesOrderAcquisition={salesOrderAcquisition} salesOrders={salesOrders} startResearch={startResearch} />;
    case 'finance': return <FinanceView achievements={achievements} companyStartedAtGameTimeMs={companyStartedAtGameTimeMs} currentGameTimeMs={currentGameTimeMs} facilities={facilities} finance={finance} inventory={inventory} market={market} onAcceptLoanOffer={onAcceptLoanOffer} onExtraPayment={onExtraLoanPayment} onRemoveLoanOffer={onRemoveLoanOffer} onRemoveUnavailableLoanOffers={onRemoveUnavailableLoanOffers} onRepayInFull={onRepayLoanInFull} onStartLoanSearch={onStartLoanSearch} research={research} />;
  }
}

