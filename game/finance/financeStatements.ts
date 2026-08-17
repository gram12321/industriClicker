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
export type AssetsStatement = { cash: number; inventory: number; facilities: number; research: number; currentAssets: number; fixedAssets: number; intangibleAssets: number; totalAssets: number };
export type LiabilitiesEquityStatement = { loans: Loan[]; totalLiabilities: number; contributedCapital: number; retainedEarnings: number; assetRevaluation: number; totalEquity: number };
export type CashFlowDetail = { id: string; description: string; detailLines: string[]; count: number; totalQuantity?: number; totalAbsoluteAmount?: number };
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

/** Current book value used consistently by the balance sheet and facility sales. */
export function calculateFacilityAssetValue(facility: Facility, market: Market): number {
  const view = facility.getView();
  const definition = getFacilityDefinition(view.facilityType);
  const replacementCost = definition.landCost
    + definition.constructionMaterialsCost * market.getLocalPrice(ResourceType.ConstructionMaterials)
    + definition.industrialMachinesCost * market.getLocalPrice(ResourceType.IndustrialMachines)
    + getFacilityUpgradeInvestmentCost(definition.upgradeCost, view.speedUpgradeLevel)
    + getFacilityUpgradeInvestmentCost(definition.upgradeCost, view.outputUpgradeLevel)
    + getFacilityUpgradeInvestmentCost(definition.upgradeCost, view.conditionDecayUpgradeLevel)
    + getFacilityUpgradeResourceInvestmentCost(definition.constructionMaterialsCost, view.speedUpgradeLevel) * market.getLocalPrice(ResourceType.ConstructionMaterials)
    + getFacilityUpgradeResourceInvestmentCost(definition.constructionMaterialsCost, view.outputUpgradeLevel) * market.getLocalPrice(ResourceType.ConstructionMaterials)
    + getFacilityUpgradeResourceInvestmentCost(definition.constructionMaterialsCost, view.conditionDecayUpgradeLevel) * market.getLocalPrice(ResourceType.ConstructionMaterials)
    + getFacilityUpgradeResourceInvestmentCost(definition.industrialMachinesCost, view.speedUpgradeLevel) * market.getLocalPrice(ResourceType.IndustrialMachines)
    + getFacilityUpgradeResourceInvestmentCost(definition.industrialMachinesCost, view.outputUpgradeLevel) * market.getLocalPrice(ResourceType.IndustrialMachines)
    + getFacilityUpgradeResourceInvestmentCost(definition.industrialMachinesCost, view.conditionDecayUpgradeLevel) * market.getLocalPrice(ResourceType.IndustrialMachines);
  return replacementCost * Math.max(0.1, view.facilityCondition);
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
  const facilities = input.facilities.getAll().reduce((total, facility) => total + calculateFacilityAssetValue(facility, input.market), 0);
  const research = input.research.getCompletedProjects().reduce((total, completed) => total + (getResearchProject(completed.projectId)?.cost ?? 0), 0);
  const cash = input.finance.getBalance();
  return { cash, inventory, facilities, research, currentAssets: cash + inventory, fixedAssets: facilities, intangibleAssets: research, totalAssets: cash + inventory + facilities + research };
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

function parseMarketTransaction(description: string): { description: string; quantity: number } | null {
  const match = /^(Autobought|Autosold|Bought|Sold) ([\d.,]+) (.+?)(?: (for production|from local market|to local market))?$/.exec(description);
  if (!match) return null;
  const quantity = Number(match[2].replace(',', '.'));
  const suffix = match[4] === 'for production' ? '' : match[4] ? ` ${match[4]}` : '';
  return Number.isFinite(quantity) && quantity > 0 ? { description: `${match[1]} ${match[3]}${suffix}`, quantity } : null;
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
    const matchingDetail = detailGroup.details.find((candidate) => marketTransaction
      ? candidate.description === marketTransaction.description
      : candidate.description === transaction.description && candidate.detailLines.join('\n') === transaction.detailLines.join('\n'));
    if (matchingDetail) {
      matchingDetail.count += 1;
      if (marketTransaction) {
        matchingDetail.totalQuantity = (matchingDetail.totalQuantity ?? 0) + marketTransaction.quantity;
        matchingDetail.totalAbsoluteAmount = (matchingDetail.totalAbsoluteAmount ?? 0) + Math.abs(transaction.amount);
      }
    } else detailGroup.details.push({ id: `${detailGroup.id}-${detailGroup.details.length}`, description: marketTransaction?.description ?? transaction.description, detailLines: transaction.detailLines, count: 1, ...(marketTransaction ? { totalQuantity: marketTransaction.quantity, totalAbsoluteAmount: Math.abs(transaction.amount) } : {}) });
  }
  return Array.from(groups.values()).sort((left, right) => right.atGameTimeMs - left.atGameTimeMs);
}
