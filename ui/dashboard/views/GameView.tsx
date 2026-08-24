import type { Dispatch, SetStateAction } from 'react';
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
import type { SalesCustomerType, SalesOrders } from '@/game/sales';
import type { TutorialProductionPresentation } from '@/game/tutorial';
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
  onFirstFacilityRecipeSelected,
  onOpenCustomer,
  onOpenCustomerType,
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
  collapsedFacilities,
  sellMarketResource,
  setMarketAutomation,
  setCollapsedFacilities,
  setOnlyInStock,
  setShowActiveRecipeInputs,
  openConstructionYard,
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
  setFacilityAutoRepair,
  setFacilityStaffing,
  trainFacilityStaff,
  repairFacility,
  startResearch,
  tutorial,
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
  onFirstFacilityRecipeSelected?: (recipeName: Recipe['name']) => void;
  onOpenCustomer: (customerId: string) => void;
  onOpenCustomerType: (customerType: SalesCustomerType) => void;
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
  collapsedFacilities: Record<string, boolean>;
  sellMarketResource: (resourceType: ResourceType, amount: number) => boolean;
  setMarketAutomation: (resourceType: ResourceType, updates: Partial<MarketAutomation>) => boolean;
  setCollapsedFacilities: Dispatch<SetStateAction<Record<string, boolean>>>;
  setOnlyInStock: (value: boolean) => void;
  setShowActiveRecipeInputs: (value: boolean) => void;
  openConstructionYard: () => void;
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
  setFacilityAutoRepair: (facilityId: string, enabled: boolean, threshold: number, target: number) => boolean;
  setFacilityStaffing: (facilityId: string, workerCount: number, wagePerWorkerPerMinute: number) => boolean;
  trainFacilityStaff?: (facilityId: string, workerCount: number) => boolean;
  repairFacility: (facilityId: string, targetCondition?: number) => boolean;
  startResearch: (projectId: ResearchProjectId) => boolean;
  tutorial: TutorialProductionPresentation;
  upgradeFacility: (facilityId: string, upgradeKind: FacilityUpgradeKind) => boolean;
}) {
  switch (activeTab) {
    case 'company': return <CompanyView companyName={companyName} onCompanyOverviewLayout={onCompanyOverviewLayout} />;
    case 'inventory':
    case 'market': return <InventoryView buyMarketResource={buyMarketResource} currentGameTimeMs={currentGameTimeMs} facilities={facilities} finance={finance} inventory={inventory} market={market} onlyInStock={onlyInStock} resourceFlow={resourceFlow} showActiveRecipeInputs={showActiveRecipeInputs} sellMarketResource={sellMarketResource} setMarketAutomation={setMarketAutomation} setOnlyInStock={setOnlyInStock} setShowActiveRecipeInputs={setShowActiveRecipeInputs} />;
    case 'production': return <ProductionView buyMarketResource={buyMarketResource} collapsedFacilities={collapsedFacilities} currentGameTimeMs={currentGameTimeMs} facilities={facilities} finance={finance} getResearchAvailability={getResearchAvailability} inventory={inventory} market={market} research={research} resourceFlow={resourceFlow} startResearch={startResearch} tutorial={tutorial} onBuildFacilityLayout={onBuildFacilityLayout} onFirstFacilityFocusLayout={onFirstFacilityFocusLayout} onFirstFacilityRecipeSelected={onFirstFacilityRecipeSelected} openConstructionYard={openConstructionYard} repairFacility={repairFacility} requestFacilityDestruction={requestFacilityDestruction} setCollapsedFacilities={setCollapsedFacilities} setFacilityAutoRepair={setFacilityAutoRepair} setFacilityProductionActive={setFacilityProductionActive} setFacilityProductionCycle={setFacilityProductionCycle} setFacilityStaffing={setFacilityStaffing} trainFacilityStaff={trainFacilityStaff} setMarketAutomation={setMarketAutomation} upgradeFacility={upgradeFacility} />;
    case 'sales': return <SalesView companyPrestige={companyPrestige} customerPipelineProgress={customerPipelineProgress} currentGameTimeMs={currentGameTimeMs} economyPhase={finance.getEconomyPhase()} fulfillSalesOrder={fulfillSalesOrder} getResearchAvailability={getResearchAvailability} inventory={inventory} market={market} maximumOpenOrders={maximumOpenOrders} onOpenCustomer={onOpenCustomer} onOpenCustomerType={onOpenCustomerType} rejectSalesOrder={rejectSalesOrder} research={research} salesOrderAcquisition={salesOrderAcquisition} salesOrders={salesOrders} startResearch={startResearch} />;
    case 'finance': return <FinanceView achievements={achievements} companyStartedAtGameTimeMs={companyStartedAtGameTimeMs} currentGameTimeMs={currentGameTimeMs} facilities={facilities} finance={finance} inventory={inventory} market={market} onAcceptLoanOffer={onAcceptLoanOffer} onExtraPayment={onExtraLoanPayment} onRemoveLoanOffer={onRemoveLoanOffer} onRemoveUnavailableLoanOffers={onRemoveUnavailableLoanOffers} onRepayInFull={onRepayLoanInFull} onStartLoanSearch={onStartLoanSearch} research={research} />;
  }
}

