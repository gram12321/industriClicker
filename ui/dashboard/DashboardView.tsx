import type { Finance } from '@/game/finance/finance';
import type { FacilityCollection } from '@/game/facilities/facilityCollection';
import type { FacilityType } from '@/game/facilities/facilityTypes';
import type { FacilityUpgradeKind } from '@/game/facilities/facilityUpgrades';
import type { Inventory } from '@/game/inventory/inventory';
import type { Recipe } from '@/game/recipes/recipeTypes';
import type { SalesContracts } from '@/game/sales/salesContracts';
import { CompanyDashboard } from './views/CompanyDashboard';
import { FinanceDashboard } from './views/FinanceDashboard';
import { InventoryDashboard } from './views/InventoryDashboard';
import { ProductionDashboard } from './views/ProductionDashboard';
import { SalesDashboard } from './views/SalesDashboard';

export type DashboardTab = 'company' | 'inventory' | 'production' | 'sales' | 'finance';

export function DashboardContent({
  activeTab,
  customerPipelineProgress,
  facilities,
  finance,
  fulfillSalesContract,
  inventory,
  openConstructionYard,
  rejectSalesContract,
  requestFacilityDestruction,
  salesContracts,
  setFacilityRecipe,
  setFacilityWorkers,
  upgradeFacility,
}: {
  activeTab: DashboardTab;
  customerPipelineProgress: number;
  facilities: FacilityCollection;
  finance: Finance;
  fulfillSalesContract: (contractId: string) => boolean;
  inventory: Inventory;
  openConstructionYard: () => void;
  rejectSalesContract: (contractId: string) => boolean;
  requestFacilityDestruction: (facilityType: FacilityType) => void;
  salesContracts: SalesContracts;
  setFacilityRecipe: (facilityType: FacilityType, recipeName: Recipe['name'] | null) => boolean;
  setFacilityWorkers: (facilityType: FacilityType, workerCount: number) => boolean;
  upgradeFacility: (facilityType: FacilityType, upgradeKind: FacilityUpgradeKind) => boolean;
}) {
  switch (activeTab) {
    case 'company': return <CompanyDashboard />;
    case 'inventory': return <InventoryDashboard inventory={inventory} />;
    case 'production': return <ProductionDashboard facilities={facilities} finance={finance} inventory={inventory} openConstructionYard={openConstructionYard} requestFacilityDestruction={requestFacilityDestruction} setFacilityRecipe={setFacilityRecipe} setFacilityWorkers={setFacilityWorkers} upgradeFacility={upgradeFacility} />;
    case 'sales': return <SalesDashboard customerPipelineProgress={customerPipelineProgress} fulfillSalesContract={fulfillSalesContract} inventory={inventory} rejectSalesContract={rejectSalesContract} salesContracts={salesContracts} />;
    case 'finance': return <FinanceDashboard finance={finance} />;
  }
}

