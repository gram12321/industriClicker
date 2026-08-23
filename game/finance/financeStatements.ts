import type { AchievementLedger } from '@/game/achievements';
import { FINANCE_INITIAL_BALANCE } from '@/game/company/companyConstants';
import type { Facility, FacilityCollection } from '@/game/facilities';
import { getFacilityDefinition, getFacilityUpgradeInvestmentCost, getFacilityUpgradeResourceInvestmentCost } from '@/game/facilities';
import type { Inventory } from '@/game/inventory';
import type { Market } from '@/game/market';
import type { ResearchLedger } from '@/game/research';
import { getResearchProject } from '@/game/research';
import { RESOURCE_TYPES, ResourceType } from '@/game/resources';
import { FINANCE_REPORT_PERIODS, type FinanceReportPeriod } from './financeConstants';
import type { Finance, FinanceTransaction, Loan } from './finance';
import { calculateCreditRating, calculateLoanLimitBreakdown, type CreditRating, type LoanLimitBreakdown } from './loanService';

export type IncomeStatement = { income: number; expenses: number; netIncome: number; incomeDetails: FinanceBreakdown[]; expenseDetails: FinanceBreakdown[] };
export type FinanceBreakdown = { label: string; amount: number };
export type AssetsStatement = { cash: number; inventory: number; facilities: number; facilityCapitalInvestment: number; facilityWearAndTear: number; facilityMarketValue: number; facilityMarketRevaluation: number; facilityMaintenanceExpense: number; research: number; currentAssets: number; fixedAssets: number; intangibleAssets: number; totalAssets: number };
export type LiabilitiesEquityStatement = { loans: Loan[]; totalLiabilities: number; contributedCapital: number; retainedEarnings: number; assetRevaluation: number; totalEquity: number };
export type CashFlowDetail = { id: string; description: string; detailLines: string[]; count: number; resourceType?: ResourceType; totalQuantity?: number; totalAbsoluteAmount?: number; totalQualityQuantity?: number; totalQualityAmount?: number };
export type CashFlowDetailGroup = { id: string; label: string; amount: number; details: CashFlowDetail[] };
export type CashFlowRow = { id: string; atGameTimeMs: number; type: string; description: string; detailGroups: CashFlowDetailGroup[]; amount: number; balance: number };
export type FinanceStatementData = { incomeStatement: IncomeStatement; assets: AssetsStatement; liabilitiesEquity: LiabilitiesEquityStatement; creditRating: CreditRating; loanLimitBreakdown: LoanLimitBreakdown; economyPhase: ReturnType<Finance['getEconomyPhase']>; cashFlowRows: CashFlowRow[] };

const SOURCE_LABELS: Record<FinanceTransaction['source'], string> = {
  'admin-adjustment': 'Capital adjustments',
  'market-purchase': 'Market purchases',
  'market-sale': 'Market sales',
  'facility-construction': 'Facility construction',
  'facility-upgrade': 'Facility upgrades',
  'facility-repair': 'Facility repairs',
  'facility-staff-wage': 'Staff wages',
  'facility-staffing': 'Staffing changes',
  'facility-production': 'Facility production',
  'research-investment': 'Research investment',
  'research-refund': 'Research refunds',
  'research-grant': 'Research grants',
  'order-sale': 'Customer orders',
  'loan-proceeds': 'Loan proceeds',
  'loan-payment': 'Loan costs',
  'loan-origination-fee': 'Loan costs',
  'loan-search-fee': 'Lender search fees',
  'loan-extra-payment-fee': 'Loan costs',
  'loan-prepayment-penalty': 'Loan costs',
  'loan-late-fee': 'Loan costs',
  'facility-sale': 'Asset sales',
  'forced-asset-liquidation': 'Debt collection',
  'loan-restructure': 'Loan restructuring',
};

/** Historical-cost and current-market facility values used by finance and facility sales. */
export function calculateFacilityAssetBreakdown(facility: Facility, market: Market, finance: Finance) {
  const view = facility.getView();
  const definition = getFacilityDefinition(view.facilityType);
  const currentConstructionValue = definition.landCost
    + definition.constructionMaterialsCost * market.getLocalPrice(ResourceType.ConstructionMaterials)
    + definition.industrialMachinesCost * market.getLocalPrice(ResourceType.IndustrialMachines);
  const currentUpgradeValue = getFacilityUpgradeInvestmentCost(definition.upgradeCost, view.speedUpgradeLevel)
    + getFacilityUpgradeInvestmentCost(definition.upgradeCost, view.outputUpgradeLevel)
    + getFacilityUpgradeInvestmentCost(definition.upgradeCost, view.conditionDecayUpgradeLevel)
    + getFacilityUpgradeInvestmentCost(definition.upgradeCost, Math.max(0, view.qualityUpgradeLevel - 1))
    + getFacilityUpgradeResourceInvestmentCost(definition.constructionMaterialsCost, view.speedUpgradeLevel) * market.getLocalPrice(ResourceType.ConstructionMaterials)
    + getFacilityUpgradeResourceInvestmentCost(definition.constructionMaterialsCost, view.outputUpgradeLevel) * market.getLocalPrice(ResourceType.ConstructionMaterials)
    + getFacilityUpgradeResourceInvestmentCost(definition.constructionMaterialsCost, view.conditionDecayUpgradeLevel) * market.getLocalPrice(ResourceType.ConstructionMaterials)
    + getFacilityUpgradeResourceInvestmentCost(definition.constructionMaterialsCost, Math.max(0, view.qualityUpgradeLevel - 1)) * market.getLocalPrice(ResourceType.ConstructionMaterials)
    + getFacilityUpgradeResourceInvestmentCost(definition.industrialMachinesCost, view.speedUpgradeLevel) * market.getLocalPrice(ResourceType.IndustrialMachines)
    + getFacilityUpgradeResourceInvestmentCost(definition.industrialMachinesCost, view.outputUpgradeLevel) * market.getLocalPrice(ResourceType.IndustrialMachines)
    + getFacilityUpgradeResourceInvestmentCost(definition.industrialMachinesCost, view.conditionDecayUpgradeLevel) * market.getLocalPrice(ResourceType.IndustrialMachines)
    + getFacilityUpgradeResourceInvestmentCost(definition.industrialMachinesCost, Math.max(0, view.qualityUpgradeLevel - 1)) * market.getLocalPrice(ResourceType.IndustrialMachines);
  const accounting = finance.getFacilityAccounting(facility.id);
  const capitalInvestment = accounting.constructionInvestment + accounting.upgradeInvestment;
  const currentReplacementValue = currentConstructionValue + currentUpgradeValue;
  const conditionMultiplier = Math.max(0.1, view.facilityCondition);
  const bookValue = capitalInvestment * conditionMultiplier;
  const currentMarketValue = currentReplacementValue * conditionMultiplier;

  return {
    bookValue,
    capitalInvestment,
    conditionMultiplier,
    constructionInvestment: accounting.constructionInvestment,
    currentConstructionValue,
    currentMarketValue,
    currentReplacementValue,
    currentUpgradeValue,
    maintenanceExpense: accounting.maintenanceExpense,
    marketRevaluation: currentMarketValue - bookValue,
    upgradeInvestment: accounting.upgradeInvestment,
    wearAndTear: capitalInvestment - bookValue,
  };
}

/** Current book value used consistently by the balance sheet and facility sales. */
export function calculateFacilityAssetValue(facility: Facility, market: Market, finance: Finance): number {
  return calculateFacilityAssetBreakdown(facility, market, finance).bookValue;
}

function periodStart(period: FinanceReportPeriod, currentGameTimeMs: number): number {
  const duration = FINANCE_REPORT_PERIODS.find((candidate) => candidate.id === period)?.durationMs ?? null;
  return duration === null ? Number.NEGATIVE_INFINITY : currentGameTimeMs - duration;
}

function inPeriod(transaction: FinanceTransaction, period: FinanceReportPeriod, currentGameTimeMs: number): boolean {
  return transaction.occurredAtGameTimeMs >= periodStart(period, currentGameTimeMs) && transaction.occurredAtGameTimeMs <= currentGameTimeMs;
}

function toBreakdowns(transactions: FinanceTransaction[]): FinanceBreakdown[] {
  const amounts = new Map<string, number>();
  for (const transaction of transactions) {
    const label = SOURCE_LABELS[transaction.source];
    amounts.set(label, (amounts.get(label) ?? 0) + Math.abs(transaction.amount));
  }
  return Array.from(amounts, ([label, amount]) => ({ label, amount })).sort((left, right) => right.amount - left.amount);
}

export function calculateAssets(input: { finance: Finance; inventory: Inventory; market: Market; facilities: FacilityCollection; research: ResearchLedger }): AssetsStatement {
  const inventory = RESOURCE_TYPES.reduce((total, resourceType) => total + input.inventory.getAmount(resourceType) * input.market.getLocalPrice(resourceType), 0);
  const facilityBreakdowns = input.facilities.getAll().map((facility) => calculateFacilityAssetBreakdown(facility, input.market, input.finance));
  const facilities = facilityBreakdowns.reduce((total, breakdown) => total + breakdown.bookValue, 0);
  const facilityCapitalInvestment = facilityBreakdowns.reduce((total, breakdown) => total + breakdown.capitalInvestment, 0);
  const facilityWearAndTear = facilityBreakdowns.reduce((total, breakdown) => total + breakdown.wearAndTear, 0);
  const facilityMarketValue = facilityBreakdowns.reduce((total, breakdown) => total + breakdown.currentMarketValue, 0);
  const facilityMarketRevaluation = facilityBreakdowns.reduce((total, breakdown) => total + breakdown.marketRevaluation, 0);
  const facilityMaintenanceExpense = facilityBreakdowns.reduce((total, breakdown) => total + breakdown.maintenanceExpense, 0);
  const research = input.research.getCompletedProjects().reduce((total, completed) => total + (getResearchProject(completed.projectId)?.cost ?? 0), 0);
  const cash = input.finance.getBalance();
  return { cash, inventory, facilities, facilityCapitalInvestment, facilityWearAndTear, facilityMarketValue, facilityMarketRevaluation, facilityMaintenanceExpense, research, currentAssets: cash + inventory, fixedAssets: facilities, intangibleAssets: research, totalAssets: cash + inventory + facilities + research };
}

export function buildFinanceStatementData(input: { finance: Finance; inventory: Inventory; market: Market; facilities: FacilityCollection; research: ResearchLedger; achievements: AchievementLedger; currentGameTimeMs: number; companyStartedAtGameTimeMs: number; period: FinanceReportPeriod; cashFlowGroupDurationMs?: number }): FinanceStatementData {
  const transactions = input.finance.getTransactions();
  const filtered = transactions.filter((transaction) => inPeriod(transaction, input.period, input.currentGameTimeMs));
  const operatingIncome = filtered.filter((transaction) => transaction.kind === 'operating' && transaction.amount > 0);
  const operatingExpenses = filtered.filter((transaction) => transaction.kind === 'operating' && transaction.amount < 0);
  const income = operatingIncome.reduce((total, transaction) => total + transaction.amount, 0);
  const expenses = operatingExpenses.reduce((total, transaction) => total + Math.abs(transaction.amount), 0);
  const assets = calculateAssets(input);
  const loans = input.finance.getLoans().filter((loan) => loan.status !== 'repaid');
  const totalLiabilities = loans.reduce((total, loan) => total + loan.remainingBalance, 0);
  const allOperatingNet = transactions.filter((transaction) => transaction.kind === 'operating').reduce((total, transaction) => total + transaction.amount, 0);
  const retainedEarnings = allOperatingNet;
  const contributedCapital = FINANCE_INITIAL_BALANCE + transactions.filter((transaction) => transaction.kind === 'equity').reduce((total, transaction) => total + transaction.amount, 0);
  const totalEquity = assets.totalAssets - totalLiabilities;
  const assetRevaluation = totalEquity - contributedCapital - retainedEarnings;
  const performance = input.finance.getLoanPerformance();
  const creditRating = calculateCreditRating({ cash: assets.cash, totalAssets: assets.totalAssets, fixedAssets: assets.fixedAssets, totalDebt: totalLiabilities, companyAgeMs: Math.max(0, input.currentGameTimeMs - input.companyStartedAtGameTimeMs), transactions, ...performance });
  const loanLimitBreakdown = calculateLoanLimitBreakdown(input.finance.getLenders(), assets.totalAssets, creditRating.score, input.finance.getLoans());
  return {
    incomeStatement: { income, expenses, netIncome: income - expenses, incomeDetails: toBreakdowns(operatingIncome), expenseDetails: toBreakdowns(operatingExpenses) },
    assets,
    liabilitiesEquity: { loans, totalLiabilities, contributedCapital, retainedEarnings, assetRevaluation, totalEquity },
    creditRating,
    loanLimitBreakdown,
    economyPhase: input.finance.getEconomyPhase(),
    cashFlowRows: buildCashFlowRows(filtered, input.cashFlowGroupDurationMs, input.companyStartedAtGameTimeMs),
  };
}

function cashFlowHeading(kind: FinanceTransaction['kind'], amount: number): string {
  const direction = amount >= 0 ? 'income' : 'expenses';
  if (kind === 'operating') return `Operating ${direction}`;
  if (kind === 'financing') return `Financing ${direction}`;
  if (kind === 'investing') return `Investing ${direction}`;
  return `Equity ${direction}`;
}

type ParsedMarketTransaction = { description: string; quantity: number; resourceType: ResourceType };

function parseMarketTransaction(description: string): ParsedMarketTransaction | null {
  const match = /^(Autobought|Autosold|Bought|Sold) ([\d.,]+) (.+?)(?: (for production|from local market|to local market))?$/.exec(description);
  if (!match) return null;
  const quantity = Number(match[2].replace(',', '.'));
  const suffix = match[4] === 'for production' ? '' : match[4] ? ` ${match[4]}` : '';
  const resourceType = RESOURCE_TYPES.find((candidate) => candidate === match[3]);
  return Number.isFinite(quantity) && quantity > 0 && resourceType ? { description: `${match[1]} ${match[3]}${suffix}`, quantity, resourceType } : null;
}

function parseMarketQuality(detailLines: readonly string[]): number | null {
  const qualityLine = detailLines.find((line) => /^Quality:\s*Q[\d.]+$/.test(line));
  if (!qualityLine) return null;
  const quality = Number(qualityLine.replace(/^Quality:\s*Q/u, ''));
  return Number.isFinite(quality) && quality > 0 ? quality : null;
}

function buildCashFlowRows(transactions: FinanceTransaction[], groupDurationMs = 60_000, bucketOriginGameTimeMs = 0): CashFlowRow[] {
  const groups = new Map<string, CashFlowRow>();
  const duration = Math.max(1, groupDurationMs);
  for (const transaction of [...transactions].sort((left, right) => left.occurredAtGameTimeMs - right.occurredAtGameTimeMs)) {
    const bucket = Math.floor(Math.max(0, transaction.occurredAtGameTimeMs - bucketOriginGameTimeMs) / duration);
    const direction = transaction.amount >= 0 ? 'income' : 'expenses';
    const key = `${transaction.kind}-${bucket}-${direction}`;
    let row = groups.get(key);
    if (!row) {
      row = { id: key, atGameTimeMs: bucketOriginGameTimeMs + bucket * duration, type: transaction.kind, description: cashFlowHeading(transaction.kind, transaction.amount), detailGroups: [], amount: 0, balance: transaction.balanceAfter };
      groups.set(key, row);
    }
    row.amount += transaction.amount;
    row.balance = transaction.balanceAfter;
    const label = SOURCE_LABELS[transaction.source];
    let detailGroup = row.detailGroups.find((candidate) => candidate.label === label);
    if (!detailGroup) {
      detailGroup = { id: `${key}-${transaction.source}`, label, amount: 0, details: [] };
      row.detailGroups.push(detailGroup);
    }
    detailGroup.amount += transaction.amount;
    const marketTransaction = parseMarketTransaction(transaction.description);
    const marketQuality = marketTransaction ? parseMarketQuality(transaction.detailLines) : null;
    const isStaffWage = transaction.source === 'facility-staff-wage';
    const detailDescription = isStaffWage ? 'Staff wages' : (marketTransaction?.description ?? transaction.description);
    const matchingDetail = detailGroup.details.find((candidate) => isStaffWage
      ? candidate.description === detailDescription
      : marketTransaction
        ? candidate.description === marketTransaction.description
        : candidate.description === transaction.description && candidate.detailLines.join('\n') === transaction.detailLines.join('\n'));
    if (matchingDetail) {
      matchingDetail.count += 1;
      if (marketTransaction) {
        matchingDetail.totalQuantity = (matchingDetail.totalQuantity ?? 0) + marketTransaction.quantity;
        matchingDetail.totalAbsoluteAmount = (matchingDetail.totalAbsoluteAmount ?? 0) + Math.abs(transaction.amount);
        if (marketQuality !== null) {
          matchingDetail.totalQualityQuantity = (matchingDetail.totalQualityQuantity ?? 0) + marketTransaction.quantity;
          matchingDetail.totalQualityAmount = (matchingDetail.totalQualityAmount ?? 0) + marketTransaction.quantity * marketQuality;
        }
      }
    } else detailGroup.details.push({
      id: `${detailGroup.id}-${detailGroup.details.length}`,
      description: detailDescription,
      detailLines: isStaffWage ? [] : transaction.detailLines,
      count: 1,
      ...(marketTransaction ? {
        resourceType: marketTransaction.resourceType,
        totalQuantity: marketTransaction.quantity,
        totalAbsoluteAmount: Math.abs(transaction.amount),
        ...(marketQuality !== null ? { totalQualityQuantity: marketTransaction.quantity, totalQualityAmount: marketTransaction.quantity * marketQuality } : {}),
      } : {}),
    });
  }
  return Array.from(groups.values()).sort((left, right) => right.atGameTimeMs - left.atGameTimeMs);
}
