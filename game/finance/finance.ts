import { ADVANCED_LOAN_CONFIG, ECONOMY_PHASES, ECONOMY_TRANSITION, FINANCE_INITIAL_BALANCE, LOAN_PAYMENT_INTERVAL_MS, LOAN_TERMS, type EconomyPhase, type FinanceTransactionKind, type FinanceTransactionSource, type LenderType } from './financeConstants';
import { createInitialLenders, estimatePrepaymentPenalty, type Lender, type LoanSearchCriteria, type LoanSearchEstimate } from './loanService';

export type FinanceTransaction = { id: string; amount: number; description: string; detailLines: string[]; kind: FinanceTransactionKind; source: FinanceTransactionSource; balanceAfter: number; occurredAtGameTimeMs: number };
export type LoanStatus = 'active' | 'repaid' | 'defaulted';
export type Loan = { id: string; lenderId: string; lenderName: string; lenderType: LenderType; principal: number; remainingBalance: number; annualInterestRate: number; periodicInterestRate: number; paymentAmount: number; originationFee: number; totalPeriods: number; remainingPeriods: number; nextPaymentAtGameTimeMs: number; missedPayments: number; totalPaid: number; status: LoanStatus };
export type LoanOffer = { id: string; lenderId: string; lenderName: string; lenderType: LenderType; principal: number; durationPeriods: number; annualInterestRate: number; periodicInterestRate: number; paymentAmount: number; originationFee: number; totalRepayment: number; totalInterest: number; totalCost: number; isAvailable: boolean; unavailableReason: string | null; paymentIntervalMs: number };
export type ActiveLoanSearch = { criteria: LoanSearchCriteria; cost: number; workRequiredMs: number; workCompletedMs: number; startedAtGameTimeMs: number };
export type FinanceTransactionInput = Omit<FinanceTransaction, 'id' | 'balanceAfter'>;
export type LoanOperationResult = { success: boolean; reason?: string };
export type FinanceSnapshot = { balance: number; transactions: FinanceTransaction[]; loans: Loan[]; lenders: Lender[]; activeLoanSearch: ActiveLoanSearch | null; loanSearchOffers: LoanOffer[]; economyPhase: EconomyPhase; lastEconomyPhasePeriod: number; onTimeLoanPayments: number; missedLoanPayments: number; paidOffLoans: number; loanDefaults: number; consecutiveNegativePeriods: number; nextTransactionNumber: number; nextLoanNumber: number };

function nonNegative(value: number): boolean { return Number.isFinite(value) && value >= 0; }
function transactionClone(transaction: FinanceTransaction): FinanceTransaction { return { ...transaction, detailLines: [...transaction.detailLines] }; }
function loanClone(loan: Loan): Loan { return { ...loan }; }
function lenderClone(lender: Lender): Lender { return { ...lender }; }
function criteriaClone(criteria: LoanSearchCriteria): LoanSearchCriteria { return { ...criteria, lenderTypes: [...criteria.lenderTypes] }; }
function offerClone(offer: LoanOffer): LoanOffer { return { ...offer }; }
function searchClone(search: ActiveLoanSearch): ActiveLoanSearch { return { ...search, criteria: criteriaClone(search.criteria) }; }
function phaseRoll(period: number): number { const value = Math.sin((period + 1) * 12_989.17) * 43_758.5453; return value - Math.floor(value); }

/** Company-owned financial state. Its calculations remain in pure finance services. */
export class Finance {
  private balance = FINANCE_INITIAL_BALANCE;
  private transactions: FinanceTransaction[] = [];
  private loans: Loan[] = [];
  private lenders: Lender[] = createInitialLenders();
  private activeLoanSearch: ActiveLoanSearch | null = null;
  private loanSearchOffers: LoanOffer[] = [];
  private economyPhase: EconomyPhase = 'stable';
  private lastEconomyPhasePeriod = -1;
  private onTimeLoanPayments = 0;
  private missedLoanPayments = 0;
  private paidOffLoans = 0;
  private loanDefaults = 0;
  private consecutiveNegativePeriods = 0;
  private nextTransactionNumber = 1;
  private nextLoanNumber = 1;

  constructor(snapshot?: FinanceSnapshot) { if (snapshot) this.restore(snapshot); }
  getBalance(): number { return this.balance; }
  canAfford(cost: number): boolean { return nonNegative(cost) && this.balance >= cost; }
  getTransactions(): FinanceTransaction[] { return this.transactions.map(transactionClone); }
  getLoans(): Loan[] { return this.loans.map(loanClone); }
  getLenders(): Lender[] { return this.lenders.map(lenderClone); }
  getActiveLoanSearch(): ActiveLoanSearch | null { return this.activeLoanSearch ? searchClone(this.activeLoanSearch) : null; }
  getLoanSearchOffers(): LoanOffer[] { return this.loanSearchOffers.map(offerClone); }
  getEconomyPhase(): EconomyPhase { return this.economyPhase; }
  getLoanPerformance() { return { onTimePayments: this.onTimeLoanPayments, missedPayments: this.missedLoanPayments, paidOffLoans: this.paidOffLoans, defaults: this.loanDefaults, consecutiveNegativePeriods: this.consecutiveNegativePeriods }; }

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

  completeLoanSearch(offers: readonly LoanOffer[]): void { this.loanSearchOffers = offers.map(offerClone); }
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
    while (this.lastEconomyPhasePeriod < currentPeriod) { this.lastEconomyPhasePeriod += 1; if (this.lastEconomyPhasePeriod < 0) continue; const index = ECONOMY_PHASES.indexOf(this.economyPhase); const probability = index === 0 || index === ECONOMY_PHASES.length - 1 ? ECONOMY_TRANSITION.edgeShiftProbability : ECONOMY_TRANSITION.middleShiftProbability; const roll = phaseRoll(this.lastEconomyPhasePeriod); if (roll < probability) this.economyPhase = ECONOMY_PHASES[Math.max(0, index - 1)]; else if (roll < probability * 2) this.economyPhase = ECONOMY_PHASES[Math.min(ECONOMY_PHASES.length - 1, index + 1)]; changed = true; }
    for (const loan of this.loans) while (loan.status === 'active' && loan.nextPaymentAtGameTimeMs <= currentGameTimeMs) {
      const dueAt = loan.nextPaymentAtGameTimeMs; const interest = loan.remainingBalance * loan.periodicInterestRate; const principalPaid = Math.max(0, Math.min(loan.remainingBalance, loan.paymentAmount - interest));
      if (this.canAfford(loan.paymentAmount)) { this.applyTransaction({ amount: -loan.paymentAmount, description: `Loan payment to ${loan.lenderName}`, detailLines: [`Interest: €${interest.toFixed(2)}`, `Principal: €${principalPaid.toFixed(2)}`, `Remaining before payment: €${loan.remainingBalance.toFixed(2)}`], kind: 'financing', source: 'loan-payment', occurredAtGameTimeMs: dueAt }); loan.remainingBalance = Math.max(0, loan.remainingBalance - principalPaid); loan.remainingPeriods = Math.max(0, loan.remainingPeriods - 1); loan.totalPaid += loan.paymentAmount; loan.missedPayments = 0; this.onTimeLoanPayments += 1; if (loan.remainingBalance <= 1 || loan.remainingPeriods === 0) { loan.remainingBalance = 0; loan.status = 'repaid'; this.paidOffLoans += 1; } }
      else { loan.missedPayments += 1; loan.remainingPeriods = Math.max(0, loan.remainingPeriods - 1); this.missedLoanPayments += 1; const fee = Math.max(10, loan.paymentAmount * 0.05); if (this.canAfford(fee)) this.applyTransaction({ amount: -fee, description: `Missed-payment penalty (${loan.lenderName})`, detailLines: [`Penalty: €${fee.toFixed(2)}`], kind: 'financing', source: 'loan-late-fee', occurredAtGameTimeMs: dueAt }); if (loan.missedPayments >= LOAN_TERMS.defaultThresholdMissedPayments) { loan.status = 'defaulted'; this.loanDefaults += 1; } }
      loan.nextPaymentAtGameTimeMs += LOAN_PAYMENT_INTERVAL_MS; changed = true;
    }
    if (currentGameTimeMs > 0 && currentGameTimeMs % (15 * 60_000) < LOAN_PAYMENT_INTERVAL_MS) this.consecutiveNegativePeriods = this.balance <= 0 ? this.consecutiveNegativePeriods + 1 : 0;
    return changed;
  }

  clone(): Finance { return Finance.fromSnapshot(this.toSnapshot()); }
  toSnapshot(): FinanceSnapshot { return { balance: this.balance, transactions: this.getTransactions(), loans: this.getLoans(), lenders: this.getLenders(), activeLoanSearch: this.getActiveLoanSearch(), loanSearchOffers: this.getLoanSearchOffers(), economyPhase: this.economyPhase, lastEconomyPhasePeriod: this.lastEconomyPhasePeriod, onTimeLoanPayments: this.onTimeLoanPayments, missedLoanPayments: this.missedLoanPayments, paidOffLoans: this.paidOffLoans, loanDefaults: this.loanDefaults, consecutiveNegativePeriods: this.consecutiveNegativePeriods, nextTransactionNumber: this.nextTransactionNumber, nextLoanNumber: this.nextLoanNumber }; }
  static fromSnapshot(snapshot: FinanceSnapshot): Finance { return new Finance(snapshot); }
  private restore(snapshot: FinanceSnapshot): void { this.balance = nonNegative(snapshot.balance) ? snapshot.balance : FINANCE_INITIAL_BALANCE; this.transactions = Array.isArray(snapshot.transactions) ? snapshot.transactions.filter((item) => Number.isFinite(item.amount) && typeof item.description === 'string' && Array.isArray(item.detailLines) && Number.isFinite(item.balanceAfter) && Number.isFinite(item.occurredAtGameTimeMs)).map(transactionClone) : []; this.loans = Array.isArray(snapshot.loans) ? snapshot.loans.filter((loan) => nonNegative(loan.principal) && nonNegative(loan.remainingBalance) && nonNegative(loan.paymentAmount) && Number.isInteger(loan.remainingPeriods)).map(loanClone) : []; this.lenders = Array.isArray(snapshot.lenders) && snapshot.lenders.length > 0 ? snapshot.lenders.map(lenderClone) : createInitialLenders(); this.activeLoanSearch = snapshot.activeLoanSearch && Number.isFinite(snapshot.activeLoanSearch.workRequiredMs) && Number.isFinite(snapshot.activeLoanSearch.workCompletedMs) && snapshot.activeLoanSearch.workRequiredMs > 0 ? searchClone(snapshot.activeLoanSearch) : null; this.loanSearchOffers = Array.isArray(snapshot.loanSearchOffers) ? snapshot.loanSearchOffers.filter((offer) => typeof offer.id === 'string' && nonNegative(offer.principal) && Number.isFinite(offer.paymentAmount)).map(offerClone) : []; this.economyPhase = ECONOMY_PHASES.includes(snapshot.economyPhase) ? snapshot.economyPhase : 'stable'; this.lastEconomyPhasePeriod = Number.isInteger(snapshot.lastEconomyPhasePeriod) ? snapshot.lastEconomyPhasePeriod : -1; this.onTimeLoanPayments = Number.isInteger(snapshot.onTimeLoanPayments) ? snapshot.onTimeLoanPayments : 0; this.missedLoanPayments = Number.isInteger(snapshot.missedLoanPayments) ? snapshot.missedLoanPayments : 0; this.paidOffLoans = Number.isInteger(snapshot.paidOffLoans) ? snapshot.paidOffLoans : 0; this.loanDefaults = Number.isInteger(snapshot.loanDefaults) ? snapshot.loanDefaults : 0; this.consecutiveNegativePeriods = Number.isInteger(snapshot.consecutiveNegativePeriods) ? snapshot.consecutiveNegativePeriods : 0; this.nextTransactionNumber = Number.isInteger(snapshot.nextTransactionNumber) && snapshot.nextTransactionNumber > 0 ? snapshot.nextTransactionNumber : this.transactions.length + 1; this.nextLoanNumber = Number.isInteger(snapshot.nextLoanNumber) && snapshot.nextLoanNumber > 0 ? snapshot.nextLoanNumber : this.loans.length + 1; }
}
