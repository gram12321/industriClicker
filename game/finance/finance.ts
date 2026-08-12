import { ADVANCED_LOAN_CONFIG, ECONOMY_PHASES, ECONOMY_TRANSITION, FINANCE_INITIAL_BALANCE, LOAN_COLLECTION, LOAN_PAYMENT_INTERVAL_MS, LOAN_TERMS, type EconomyPhase, type FinanceTransactionKind, type FinanceTransactionSource, type LenderType } from './financeConstants';
import { createInitialLenders, estimatePrepaymentPenalty, type Lender, type LoanSearchCriteria, type LoanSearchEstimate } from './loanService';

export type FinanceTransaction = { id: string; amount: number; description: string; detailLines: string[]; kind: FinanceTransactionKind; source: FinanceTransactionSource; balanceAfter: number; occurredAtGameTimeMs: number };
export type LoanStatus = 'active' | 'repaid' | 'defaulted';
export type Loan = { id: string; lenderId: string; lenderName: string; lenderType: LenderType; principal: number; remainingBalance: number; annualInterestRate: number; periodicInterestRate: number; paymentAmount: number; originationFee: number; totalPeriods: number; remainingPeriods: number; nextPaymentAtGameTimeMs: number; missedPayments: number; totalPaid: number; status: LoanStatus };
export type LoanOffer = { id: string; lenderId: string; lenderName: string; lenderType: LenderType; principal: number; durationPeriods: number; annualInterestRate: number; periodicInterestRate: number; paymentAmount: number; originationFee: number; totalRepayment: number; totalInterest: number; totalCost: number; isAvailable: boolean; unavailableReason: string | null; paymentIntervalMs: number };
export type ActiveLoanSearch = { criteria: LoanSearchCriteria; cost: number; workRequiredMs: number; workCompletedMs: number; startedAtGameTimeMs: number };
export type LoanSearchResult = { requestedOfferCount: number; foundOfferCount: number; availableOfferCount: number; completedAtGameTimeMs: number };
export type FinanceTransactionInput = Omit<FinanceTransaction, 'id' | 'balanceAfter'>;
export type LoanOperationResult = { success: boolean; reason?: string };
export type LoanCollectionStage = 'warning' | 'penalty' | 'liquidation' | 'default';
export type LoanCollectionNotice = { id: string; loanId: string; lenderName: string; missedPayments: number; stage: LoanCollectionStage; title: string; message: string; occurredAtGameTimeMs: number };
export type DebtRestructureOffer = { loanId: string; lenderName: string; principal: number; annualInterestRate: number; periodicInterestRate: number; paymentAmount: number; durationPeriods: number };
export type FinanceAdvanceResult = { changed: boolean; collectionNotices: LoanCollectionNotice[] };
export type FinanceSnapshot = { balance: number; transactions: FinanceTransaction[]; loans: Loan[]; lenders: Lender[]; activeLoanSearch: ActiveLoanSearch | null; loanSearchOffers: LoanOffer[]; lastLoanSearchResult: LoanSearchResult | null; economyPhase: EconomyPhase; lastEconomyPhasePeriod: number; onTimeLoanPayments: number; missedLoanPayments: number; paidOffLoans: number; loanDefaults: number; consecutiveNegativePeriods: number; nextTransactionNumber: number; nextLoanNumber: number; collectionNotices: LoanCollectionNotice[]; pendingRestructureOffer: DebtRestructureOffer | null; nextCollectionNoticeNumber: number };

function nonNegative(value: number): boolean { return Number.isFinite(value) && value >= 0; }
function transactionClone(transaction: FinanceTransaction): FinanceTransaction { return { ...transaction, detailLines: [...transaction.detailLines] }; }
function loanClone(loan: Loan): Loan { return { ...loan }; }
function lenderClone(lender: Lender): Lender { return { ...lender }; }
function criteriaClone(criteria: LoanSearchCriteria): LoanSearchCriteria { return { ...criteria, lenderTypes: [...criteria.lenderTypes] }; }
function offerClone(offer: LoanOffer): LoanOffer { return { ...offer }; }
function searchClone(search: ActiveLoanSearch): ActiveLoanSearch { return { ...search, criteria: criteriaClone(search.criteria) }; }
function searchResultClone(result: LoanSearchResult): LoanSearchResult { return { ...result }; }
function noticeClone(notice: LoanCollectionNotice): LoanCollectionNotice { return { ...notice }; }
function restructureClone(offer: DebtRestructureOffer): DebtRestructureOffer { return { ...offer }; }
function phaseRoll(period: number): number { const value = Math.sin((period + 1) * 12_989.17) * 43_758.5453; return value - Math.floor(value); }

/** Company-owned financial state. Its calculations remain in pure finance services. */
export class Finance {
  private balance = FINANCE_INITIAL_BALANCE;
  private transactions: FinanceTransaction[] = [];
  private loans: Loan[] = [];
  private lenders: Lender[] = createInitialLenders();
  private activeLoanSearch: ActiveLoanSearch | null = null;
  private loanSearchOffers: LoanOffer[] = [];
  private lastLoanSearchResult: LoanSearchResult | null = null;
  private economyPhase: EconomyPhase = 'stable';
  private lastEconomyPhasePeriod = -1;
  private onTimeLoanPayments = 0;
  private missedLoanPayments = 0;
  private paidOffLoans = 0;
  private loanDefaults = 0;
  private consecutiveNegativePeriods = 0;
  private nextTransactionNumber = 1;
  private nextLoanNumber = 1;
  private collectionNotices: LoanCollectionNotice[] = [];
  private pendingRestructureOffer: DebtRestructureOffer | null = null;
  private nextCollectionNoticeNumber = 1;

  constructor(snapshot?: FinanceSnapshot) { if (snapshot) this.restore(snapshot); }
  getBalance(): number { return this.balance; }
  canAfford(cost: number): boolean { return nonNegative(cost) && this.balance >= cost; }
  getTransactions(): FinanceTransaction[] { return this.transactions.map(transactionClone); }
  getLoans(): Loan[] { return this.loans.map(loanClone); }
  getLenders(): Lender[] { return this.lenders.map(lenderClone); }
  getActiveLoanSearch(): ActiveLoanSearch | null { return this.activeLoanSearch ? searchClone(this.activeLoanSearch) : null; }
  getLoanSearchOffers(): LoanOffer[] { return this.loanSearchOffers.map(offerClone); }
  getLastLoanSearchResult(): LoanSearchResult | null { return this.lastLoanSearchResult ? searchResultClone(this.lastLoanSearchResult) : null; }
  getEconomyPhase(): EconomyPhase { return this.economyPhase; }
  getLoanPerformance() { return { onTimePayments: this.onTimeLoanPayments, missedPayments: this.missedLoanPayments, paidOffLoans: this.paidOffLoans, defaults: this.loanDefaults, consecutiveNegativePeriods: this.consecutiveNegativePeriods }; }
  getCollectionNotices(): LoanCollectionNotice[] { return this.collectionNotices.map(noticeClone); }
  getPendingRestructureOffer(): DebtRestructureOffer | null { return this.pendingRestructureOffer ? restructureClone(this.pendingRestructureOffer) : null; }
  acknowledgeCollectionNotice(noticeId: string): boolean { const count = this.collectionNotices.length; this.collectionNotices = this.collectionNotices.filter((notice) => notice.id !== noticeId); return count !== this.collectionNotices.length; }

  applyTransaction(input: FinanceTransactionInput): boolean {
    if (!Number.isFinite(input.amount) || input.description.trim().length === 0 || !Number.isFinite(input.occurredAtGameTimeMs) || input.detailLines.some((line) => line.trim().length === 0)) return false;
    const balanceAfter = this.balance + input.amount;
    if (!nonNegative(balanceAfter)) return false;
    this.balance = balanceAfter;
    this.transactions.push({ ...input, id: `finance-${this.nextTransactionNumber}`, balanceAfter, detailLines: [...input.detailLines] });
    this.nextTransactionNumber += 1;
    return true;
  }

  acceptLoan(offer: LoanOffer, occurredAtGameTimeMs: number): Loan | null {
    const selectedOffer = this.loanSearchOffers.find((candidate) => candidate.id === offer.id);
    if (!selectedOffer) return null;
    offer = selectedOffer;
    if (!offer.isAvailable || !nonNegative(offer.principal) || offer.principal <= 0 || !Number.isInteger(offer.durationPeriods) || offer.durationPeriods < 1 || !Number.isFinite(occurredAtGameTimeMs)) return null;
    const loan: Loan = { id: `loan-${this.nextLoanNumber}`, lenderId: offer.lenderId, lenderName: offer.lenderName, lenderType: offer.lenderType, principal: offer.principal, remainingBalance: offer.principal, annualInterestRate: offer.annualInterestRate, periodicInterestRate: offer.periodicInterestRate, paymentAmount: offer.paymentAmount, originationFee: offer.originationFee, totalPeriods: offer.durationPeriods, remainingPeriods: offer.durationPeriods, nextPaymentAtGameTimeMs: occurredAtGameTimeMs + offer.paymentIntervalMs, missedPayments: 0, totalPaid: 0, status: 'active' };
    if (!this.applyTransaction({ amount: offer.principal, description: `Loan received from ${offer.lenderName}`, detailLines: [`Principal: €${offer.principal.toFixed(2)}`, `Per-minute rate: ${(offer.periodicInterestRate * 100).toFixed(3)}%`, `Term: ${offer.durationPeriods} payments`], kind: 'financing', source: 'loan-proceeds', occurredAtGameTimeMs })) return null;
    if (offer.originationFee > 0 && !this.applyTransaction({ amount: -offer.originationFee, description: `Loan origination fee (${offer.lenderName})`, detailLines: [`Fee: €${offer.originationFee.toFixed(2)}`], kind: 'financing', source: 'loan-origination-fee', occurredAtGameTimeMs })) return null;
    this.loans.push(loan); this.nextLoanNumber += 1; this.loanSearchOffers = this.loanSearchOffers.filter((candidate) => candidate.id !== offer.id); return loanClone(loan);
  }

  startLoanSearch(criteria: LoanSearchCriteria, estimate: LoanSearchEstimate, occurredAtGameTimeMs: number): LoanOperationResult {
    if (this.activeLoanSearch) return { success: false, reason: 'A lender search is already in progress.' };
    if (!Number.isFinite(estimate.cost) || estimate.cost < 0 || !Number.isFinite(estimate.workRequiredMs) || estimate.workRequiredMs <= 0) return { success: false, reason: 'Invalid search estimate.' };
    if (!this.canAfford(estimate.cost)) return { success: false, reason: `Insufficient funds for the €${estimate.cost.toFixed(0)} search cost.` };
    const details = [`Lender types: ${criteria.lenderTypes.length === 0 ? 'All' : criteria.lenderTypes.join(', ')}`, `Amount range: €${criteria.amountMin.toFixed(0)}–€${criteria.amountMax.toFixed(0)}`, `Term range: ${criteria.durationMinPeriods}–${criteria.durationMaxPeriods} payments`, `Offer target: ${criteria.offerCount}`, `Search work: ${(estimate.workRequiredMs / 1_000).toFixed(0)} seconds`];
    if (estimate.cost > 0 && !this.applyTransaction({ amount: -estimate.cost, description: 'Lender search cost', detailLines: details, kind: 'operating', source: 'loan-search-fee', occurredAtGameTimeMs })) return { success: false, reason: 'Search cost could not be recorded.' };
    this.loanSearchOffers = [];
    this.lastLoanSearchResult = null;
    this.activeLoanSearch = { criteria: criteriaClone(criteria), cost: estimate.cost, workRequiredMs: estimate.workRequiredMs, workCompletedMs: 0, startedAtGameTimeMs: occurredAtGameTimeMs };
    return { success: true };
  }

  advanceLoanSearch(elapsedMs: number): LoanSearchCriteria | null {
    if (!this.activeLoanSearch || !Number.isFinite(elapsedMs) || elapsedMs <= 0) return null;
    this.activeLoanSearch.workCompletedMs = Math.min(this.activeLoanSearch.workRequiredMs, this.activeLoanSearch.workCompletedMs + Math.floor(elapsedMs));
    if (this.activeLoanSearch.workCompletedMs < this.activeLoanSearch.workRequiredMs) return null;
    const criteria = criteriaClone(this.activeLoanSearch.criteria);
    this.activeLoanSearch = null;
    return criteria;
  }

  completeLoanSearch(offers: readonly LoanOffer[], requestedOfferCount: number, completedAtGameTimeMs: number): void { this.loanSearchOffers = offers.map(offerClone); this.lastLoanSearchResult = { requestedOfferCount, foundOfferCount: offers.length, availableOfferCount: offers.filter((offer) => offer.isAvailable).length, completedAtGameTimeMs }; }
  refreshLoanSearchOffers(offers: readonly LoanOffer[]): void { this.loanSearchOffers = offers.map(offerClone); }
  removeUnavailableLoanSearchOffers(): number { const count = this.loanSearchOffers.filter((offer) => !offer.isAvailable).length; this.loanSearchOffers = this.loanSearchOffers.filter((offer) => offer.isAvailable); return count; }
  removeLoanSearchOffer(offerId: string): boolean { const count = this.loanSearchOffers.length; this.loanSearchOffers = this.loanSearchOffers.filter((offer) => offer.id !== offerId); return this.loanSearchOffers.length !== count; }

  makeExtraLoanPayment(loanId: string, occurredAtGameTimeMs: number): LoanOperationResult {
    const loan = this.loans.find((candidate) => candidate.id === loanId);
    if (!loan) return { success: false, reason: 'Loan not found.' }; if (loan.status !== 'active') return { success: false, reason: 'Only active loans accept extra payments.' };
    const payment = Math.min(loan.paymentAmount, loan.remainingBalance); const fee = Math.max(payment * ADVANCED_LOAN_CONFIG.extraPaymentAdminFeeRate, ADVANCED_LOAN_CONFIG.extraPaymentAdminFeeMin);
    if (!this.canAfford(payment + fee)) return { success: false, reason: 'Insufficient funds for the extra payment.' };
    this.applyTransaction({ amount: -payment, description: `Extra payment to ${loan.lenderName}`, detailLines: [`Principal reduction: €${payment.toFixed(2)}`], kind: 'financing', source: 'loan-payment', occurredAtGameTimeMs });
    this.applyTransaction({ amount: -fee, description: `Administration fee for extra payment (${loan.lenderName})`, detailLines: [`Fee: €${fee.toFixed(2)}`], kind: 'financing', source: 'loan-extra-payment-fee', occurredAtGameTimeMs });
    loan.remainingBalance = Math.max(0, loan.remainingBalance - payment); loan.remainingPeriods = Math.max(0, loan.remainingPeriods - 1); loan.missedPayments = 0; loan.totalPaid += payment; this.onTimeLoanPayments += 1;
    if (loan.remainingBalance <= 0.01 || loan.remainingPeriods === 0) { loan.remainingBalance = 0; loan.status = 'repaid'; this.paidOffLoans += 1; }
    return { success: true };
  }

  repayLoanInFull(loanId: string, occurredAtGameTimeMs: number): LoanOperationResult {
    const loan = this.loans.find((candidate) => candidate.id === loanId);
    if (!loan) return { success: false, reason: 'Loan not found.' }; if (loan.status !== 'active') return { success: false, reason: 'Only active loans can be fully repaid.' };
    const penalty = estimatePrepaymentPenalty(loan); if (!this.canAfford(loan.remainingBalance + penalty)) return { success: false, reason: 'Insufficient funds for full repayment.' };
    this.applyTransaction({ amount: -loan.remainingBalance, description: `Loan fully repaid (${loan.lenderName})`, detailLines: [`Principal payoff: €${loan.remainingBalance.toFixed(2)}`], kind: 'financing', source: 'loan-payment', occurredAtGameTimeMs });
    if (penalty > 0) this.applyTransaction({ amount: -penalty, description: `Prepayment penalty (${loan.lenderName})`, detailLines: [`Penalty: €${penalty.toFixed(2)}`], kind: 'financing', source: 'loan-prepayment-penalty', occurredAtGameTimeMs });
    loan.totalPaid += loan.remainingBalance; loan.remainingBalance = 0; loan.remainingPeriods = 0; loan.missedPayments = 0; loan.status = 'repaid'; this.paidOffLoans += 1; return { success: true };
  }

  advanceLoanAndEconomy(currentGameTimeMs: number): boolean {
    if (!Number.isFinite(currentGameTimeMs)) return false; let changed = false;
    const currentPeriod = Math.floor(currentGameTimeMs / ECONOMY_TRANSITION.periodMs);
    while (this.lastEconomyPhasePeriod < currentPeriod) { this.lastEconomyPhasePeriod += 1; if (this.lastEconomyPhasePeriod < 0) continue; const index = ECONOMY_PHASES.indexOf(this.economyPhase); const roll = phaseRoll(this.lastEconomyPhasePeriod); const stableIndex = ECONOMY_PHASES.indexOf('stable'); if (index === 0 && roll < ECONOMY_TRANSITION.edgeReturnProbability) this.economyPhase = ECONOMY_PHASES[index + 1]; else if (index === ECONOMY_PHASES.length - 1 && roll < ECONOMY_TRANSITION.edgeReturnProbability) this.economyPhase = ECONOMY_PHASES[index - 1]; else if (index < stableIndex && roll < ECONOMY_TRANSITION.middleReturnProbability) this.economyPhase = ECONOMY_PHASES[index + 1]; else if (index < stableIndex && roll < ECONOMY_TRANSITION.middleReturnProbability + ECONOMY_TRANSITION.middleWorsenProbability) this.economyPhase = ECONOMY_PHASES[index - 1]; else if (index > stableIndex && roll < ECONOMY_TRANSITION.middleReturnProbability) this.economyPhase = ECONOMY_PHASES[index - 1]; else if (index > stableIndex && roll < ECONOMY_TRANSITION.middleReturnProbability + ECONOMY_TRANSITION.middleWorsenProbability) this.economyPhase = ECONOMY_PHASES[index + 1]; else if (index === stableIndex && roll < ECONOMY_TRANSITION.stableShiftProbability) this.economyPhase = ECONOMY_PHASES[index - 1]; else if (index === stableIndex && roll < ECONOMY_TRANSITION.stableShiftProbability * 2) this.economyPhase = ECONOMY_PHASES[index + 1]; changed = true; }
    for (const loan of this.loans) while (loan.status === 'active' && loan.nextPaymentAtGameTimeMs <= currentGameTimeMs) {
      const dueAt = loan.nextPaymentAtGameTimeMs; const interest = loan.remainingBalance * loan.periodicInterestRate; const principalPaid = Math.max(0, Math.min(loan.remainingBalance, loan.paymentAmount - interest));
      if (this.canAfford(loan.paymentAmount)) { this.applyTransaction({ amount: -loan.paymentAmount, description: `Loan payment to ${loan.lenderName}`, detailLines: [`Interest: €${interest.toFixed(2)}`, `Principal: €${principalPaid.toFixed(2)}`, `Remaining before payment: €${loan.remainingBalance.toFixed(2)}`], kind: 'financing', source: 'loan-payment', occurredAtGameTimeMs: dueAt }); loan.remainingBalance = Math.max(0, loan.remainingBalance - principalPaid); loan.remainingPeriods = Math.max(0, loan.remainingPeriods - 1); loan.totalPaid += loan.paymentAmount; loan.missedPayments = 0; this.onTimeLoanPayments += 1; if (loan.remainingBalance <= 1 || loan.remainingPeriods === 0) { loan.remainingBalance = 0; loan.status = 'repaid'; this.paidOffLoans += 1; } }
      else { loan.missedPayments += 1; loan.remainingPeriods = Math.max(0, loan.remainingPeriods - 1); this.missedLoanPayments += 1; const fee = Math.max(10, loan.paymentAmount * 0.05); if (this.canAfford(fee)) this.applyTransaction({ amount: -fee, description: `Missed-payment penalty (${loan.lenderName})`, detailLines: [`Penalty: €${fee.toFixed(2)}`], kind: 'financing', source: 'loan-late-fee', occurredAtGameTimeMs: dueAt }); if (loan.missedPayments >= LOAN_TERMS.defaultThresholdMissedPayments) { loan.status = 'defaulted'; this.loanDefaults += 1; } }
      const stage: LoanCollectionStage | null = loan.missedPayments === LOAN_COLLECTION.warningMisses ? 'warning' : loan.missedPayments === LOAN_COLLECTION.penaltyMisses ? 'penalty' : loan.missedPayments === LOAN_COLLECTION.liquidationMisses ? 'liquidation' : loan.missedPayments === LOAN_COLLECTION.defaultMisses ? 'default' : null;
      if (stage === 'penalty') { loan.periodicInterestRate += LOAN_COLLECTION.penaltyInterestRateIncrease / 52; loan.annualInterestRate += LOAN_COLLECTION.penaltyInterestRateIncrease; loan.remainingBalance += loan.remainingBalance * LOAN_COLLECTION.balanceSurchargeRate; }
      if (stage === 'default') { this.lenders = this.lenders.map((lender) => lender.id === loan.lenderId ? { ...lender, blacklisted: true } : lender); this.pendingRestructureOffer = this.createRestructureOffer(loan); }
      if (stage) this.addCollectionNotice(loan, stage, dueAt);
      loan.nextPaymentAtGameTimeMs += LOAN_PAYMENT_INTERVAL_MS; changed = true;
    }
    if (currentGameTimeMs > 0 && currentGameTimeMs % (15 * 60_000) < LOAN_PAYMENT_INTERVAL_MS) this.consecutiveNegativePeriods = this.balance <= 0 ? this.consecutiveNegativePeriods + 1 : 0;
    return changed;
  }

  clone(): Finance { return Finance.fromSnapshot(this.toSnapshot()); }
  applyDebtRecovery(loanId: string, amount: number, occurredAtGameTimeMs: number): number { const loan = this.loans.find((candidate) => candidate.id === loanId && candidate.status !== 'repaid'); const recovery = loan && Number.isFinite(amount) ? Math.min(Math.max(0, amount), loan.remainingBalance, this.balance) : 0; if (!loan || recovery <= 0 || !this.applyTransaction({ amount: -recovery, description: `Debt collection payment (${loan.lenderName})`, detailLines: [`Applied debt recovery: €${recovery.toFixed(2)}`], kind: 'financing', source: 'forced-asset-liquidation', occurredAtGameTimeMs })) return 0; loan.remainingBalance -= recovery; loan.totalPaid += recovery; if (loan.remainingBalance <= 0.01) { loan.remainingBalance = 0; loan.status = 'repaid'; this.paidOffLoans += 1; } return recovery; }
  acceptRestructure(occurredAtGameTimeMs: number): LoanOperationResult { const offer = this.pendingRestructureOffer; const loan = offer && this.loans.find((candidate) => candidate.id === offer.loanId); if (!offer || !loan || loan.status !== 'defaulted') return { success: false, reason: 'No debt restructure is available.' }; loan.status = 'repaid'; loan.remainingBalance = 0; loan.remainingPeriods = 0; this.loans.push({ id: `loan-${this.nextLoanNumber}`, lenderId: 'collections-recovery', lenderName: 'Collections Recovery', lenderType: 'quickloan', principal: offer.principal, remainingBalance: offer.principal, annualInterestRate: offer.annualInterestRate, periodicInterestRate: offer.periodicInterestRate, paymentAmount: offer.paymentAmount, originationFee: 0, totalPeriods: offer.durationPeriods, remainingPeriods: offer.durationPeriods, nextPaymentAtGameTimeMs: occurredAtGameTimeMs + LOAN_PAYMENT_INTERVAL_MS, missedPayments: 0, totalPaid: 0, status: 'active' }); this.nextLoanNumber += 1; this.pendingRestructureOffer = null; this.applyTransaction({ amount: 0, description: 'Debt restructured with Collections Recovery', detailLines: [`New balance: €${offer.principal.toFixed(2)}`, `Term: ${offer.durationPeriods} payments`], kind: 'financing', source: 'loan-restructure', occurredAtGameTimeMs }); return { success: true }; }
  toSnapshot(): FinanceSnapshot { return { balance: this.balance, transactions: this.getTransactions(), loans: this.getLoans(), lenders: this.getLenders(), activeLoanSearch: this.getActiveLoanSearch(), loanSearchOffers: this.getLoanSearchOffers(), lastLoanSearchResult: this.getLastLoanSearchResult(), economyPhase: this.economyPhase, lastEconomyPhasePeriod: this.lastEconomyPhasePeriod, onTimeLoanPayments: this.onTimeLoanPayments, missedLoanPayments: this.missedLoanPayments, paidOffLoans: this.paidOffLoans, loanDefaults: this.loanDefaults, consecutiveNegativePeriods: this.consecutiveNegativePeriods, nextTransactionNumber: this.nextTransactionNumber, nextLoanNumber: this.nextLoanNumber, collectionNotices: this.getCollectionNotices(), pendingRestructureOffer: this.getPendingRestructureOffer(), nextCollectionNoticeNumber: this.nextCollectionNoticeNumber }; }
  static fromSnapshot(snapshot: FinanceSnapshot): Finance { return new Finance(snapshot); }
  private addCollectionNotice(loan: Loan, stage: LoanCollectionStage, occurredAtGameTimeMs: number): void { const copy = stage === 'warning' ? ['Payment missed', 'A late fee was charged. Pay before collection escalates.'] : stage === 'penalty' ? ['Serious delinquency', 'Interest and the balance have increased; company prestige was damaged.'] : stage === 'liquidation' ? ['Forced liquidation', 'Inventory and facilities will be sold to reduce this debt.'] : ['Loan default', 'This lender blacklisted the company. A punitive restructure is available.']; this.collectionNotices.push({ id: `collection-${this.nextCollectionNoticeNumber}`, loanId: loan.id, lenderName: loan.lenderName, missedPayments: loan.missedPayments, stage, title: copy[0], message: copy[1], occurredAtGameTimeMs }); this.nextCollectionNoticeNumber += 1; }
  private createRestructureOffer(loan: Loan): DebtRestructureOffer { const principal = loan.remainingBalance; const durationPeriods = Math.max(LOAN_COLLECTION.restructureMinimumPeriods, loan.remainingPeriods * LOAN_COLLECTION.restructureTermMultiplier); const periodicInterestRate = LOAN_COLLECTION.restructureAnnualRate / 52; const paymentAmount = principal * periodicInterestRate * (1 + periodicInterestRate) ** durationPeriods / ((1 + periodicInterestRate) ** durationPeriods - 1); return { loanId: loan.id, lenderName: loan.lenderName, principal, annualInterestRate: LOAN_COLLECTION.restructureAnnualRate, periodicInterestRate, paymentAmount, durationPeriods }; }
  private restore(snapshot: FinanceSnapshot): void { this.balance = nonNegative(snapshot.balance) ? snapshot.balance : FINANCE_INITIAL_BALANCE; this.transactions = Array.isArray(snapshot.transactions) ? snapshot.transactions.filter((item) => Number.isFinite(item.amount) && typeof item.description === 'string' && Array.isArray(item.detailLines) && Number.isFinite(item.balanceAfter) && Number.isFinite(item.occurredAtGameTimeMs)).map(transactionClone) : []; this.loans = Array.isArray(snapshot.loans) ? snapshot.loans.filter((loan) => nonNegative(loan.principal) && nonNegative(loan.remainingBalance) && nonNegative(loan.paymentAmount) && Number.isInteger(loan.remainingPeriods)).map(loanClone) : []; this.lenders = Array.isArray(snapshot.lenders) && snapshot.lenders.length > 0 ? snapshot.lenders.map(lenderClone) : createInitialLenders(); this.activeLoanSearch = snapshot.activeLoanSearch && Number.isFinite(snapshot.activeLoanSearch.workRequiredMs) && Number.isFinite(snapshot.activeLoanSearch.workCompletedMs) && snapshot.activeLoanSearch.workRequiredMs > 0 ? searchClone(snapshot.activeLoanSearch) : null; this.loanSearchOffers = Array.isArray(snapshot.loanSearchOffers) ? snapshot.loanSearchOffers.filter((offer) => typeof offer.id === 'string' && nonNegative(offer.principal) && Number.isFinite(offer.paymentAmount)).map(offerClone) : []; this.lastLoanSearchResult = snapshot.lastLoanSearchResult && Number.isInteger(snapshot.lastLoanSearchResult.requestedOfferCount) && Number.isInteger(snapshot.lastLoanSearchResult.foundOfferCount) && Number.isInteger(snapshot.lastLoanSearchResult.availableOfferCount) && Number.isFinite(snapshot.lastLoanSearchResult.completedAtGameTimeMs) ? searchResultClone(snapshot.lastLoanSearchResult) : null; this.economyPhase = ECONOMY_PHASES.includes(snapshot.economyPhase) ? snapshot.economyPhase : 'stable'; this.lastEconomyPhasePeriod = Number.isInteger(snapshot.lastEconomyPhasePeriod) ? snapshot.lastEconomyPhasePeriod : -1; this.onTimeLoanPayments = Number.isInteger(snapshot.onTimeLoanPayments) ? snapshot.onTimeLoanPayments : 0; this.missedLoanPayments = Number.isInteger(snapshot.missedLoanPayments) ? snapshot.missedLoanPayments : 0; this.paidOffLoans = Number.isInteger(snapshot.paidOffLoans) ? snapshot.paidOffLoans : 0; this.loanDefaults = Number.isInteger(snapshot.loanDefaults) ? snapshot.loanDefaults : 0; this.consecutiveNegativePeriods = Number.isInteger(snapshot.consecutiveNegativePeriods) ? snapshot.consecutiveNegativePeriods : 0; this.nextTransactionNumber = Number.isInteger(snapshot.nextTransactionNumber) && snapshot.nextTransactionNumber > 0 ? snapshot.nextTransactionNumber : this.transactions.length + 1; this.nextLoanNumber = Number.isInteger(snapshot.nextLoanNumber) && snapshot.nextLoanNumber > 0 ? snapshot.nextLoanNumber : this.loans.length + 1; this.collectionNotices = Array.isArray(snapshot.collectionNotices) ? snapshot.collectionNotices.filter((notice) => typeof notice.id === 'string' && typeof notice.loanId === 'string' && typeof notice.lenderName === 'string' && typeof notice.title === 'string' && typeof notice.message === 'string' && ['warning', 'penalty', 'liquidation', 'default'].includes(notice.stage)).map(noticeClone) : []; this.pendingRestructureOffer = snapshot.pendingRestructureOffer && typeof snapshot.pendingRestructureOffer.loanId === 'string' ? restructureClone(snapshot.pendingRestructureOffer) : null; this.nextCollectionNoticeNumber = Number.isInteger(snapshot.nextCollectionNoticeNumber) && snapshot.nextCollectionNoticeNumber > 0 ? snapshot.nextCollectionNoticeNumber : this.collectionNotices.length + 1; }
}
