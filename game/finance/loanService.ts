import { ADVANCED_LOAN_CONFIG, COMPANY_STABILITY_CONFIG, CREDIT_GRADE_THRESHOLDS, CREDIT_RATING_CONFIG, ECONOMY_INTEREST_MULTIPLIERS, LENDER_NAME_POOLS, LENDER_OFFER_CONFIG, LENDER_SEARCH_CONFIG, LENDER_TYPE_CONFIG, LOAN_PAYMENT_INTERVAL_MS, LOAN_TERMS, type EconomyPhase, type LenderType } from './financeConstants';
import type { FinanceTransaction, Loan, LoanOffer } from './finance';

export type Lender = {
  id: string; name: string; type: LenderType; riskTolerance: number; flexibility: number; marketPresence: number;
  marketCapitalization: number; maxSingleBorrowerExposureRate: number; baseAnnualRate: number;
  minLoanAmount: number; maxLoanAmount: number; minDurationPeriods: number; maxDurationPeriods: number;
  originationFeeBaseRate: number; originationFeeMin: number; originationFeeMax: number; blacklisted: boolean;
};
export type CreditRatingBreakdown = {
  baseRating: number;
  assetHealth: { debtToAssetRatio: number; assetCoverage: number; liquidityRatio: number; fixedAssetRatio: number; score: number };
  paymentHistory: { onTimePayments: number; missedPayments: number; paidOffLoans: number; defaults: number; score: number };
  companyStability: { companyAgeHours: number; profitConsistency: number; expenseEfficiency: number; score: number };
  negativeBalance: { consecutiveNegativePeriods: number; penalty: number };
};
export type CreditRating = { score: number; grade: string; breakdown: CreditRatingBreakdown };
export type LenderLoanLimitBreakdown = {
  lenderId: string; lenderName: string; lenderType: LenderType; isAvailable: boolean; unavailableReason: string | null; availabilityThreshold: number;
  assetFactor: number; ratingFactor: number; assetCap: number; ratingCap: number; marketCapitalization: number; maxSingleBorrowerExposureRate: number;
  marketCapLimit: number; lenderContractLimit: number; policyCap: number; outstandingBalance: number; availableLimit: number;
};
export type LoanLimitBreakdown = { totalAssets: number; creditScore: number; grossBorrowingLimit: number; outstandingBalance: number; availableBorrowingLimit: number; lenderBreakdowns: LenderLoanLimitBreakdown[] };
export type LoanSearchCriteria = { lenderTypes: readonly LenderType[]; amountMin: number; amountMax: number; durationMinPeriods: number; durationMaxPeriods: number; offerCount: number };
export type LoanSearchEstimate = { cost: number; workRequiredMs: number; offerMultiplier: number; lenderTypeMultiplier: number; amountRangeMultiplier: number; durationRangeMultiplier: number };

function clamp(value: number, minimum: number, maximum: number): number { return Math.max(minimum, Math.min(maximum, value)); }
function clamp01(value: number): number { return clamp(value, 0, 1); }
function seededRandom(seed: number): () => number { let value = seed >>> 0; return () => { value += 0x6D2B79F5; let result = value; result = Math.imul(result ^ (result >>> 15), result | 1); result ^= result + Math.imul(result ^ (result >>> 7), result | 61); return ((result ^ (result >>> 14)) >>> 0) / 4_294_967_296; }; }
function inRange(random: () => number, range: readonly [number, number]): number { return range[0] + random() * (range[1] - range[0]); }
function outstandingBalance(loans: readonly Loan[]): number { return loans.filter((loan) => loan.status === 'active' || loan.status === 'defaulted').reduce((sum, loan) => sum + loan.remainingBalance, 0); }

/** Creates the same lender portfolio for every fresh company; the portfolio is then saved with that company. */
export function createInitialLenders(seed = 20260810): Lender[] {
  const random = seededRandom(seed);
  const lenders: Lender[] = [];
  for (const type of Object.keys(LENDER_TYPE_CONFIG) as LenderType[]) {
    const config = LENDER_TYPE_CONFIG[type];
    const names = LENDER_NAME_POOLS[type];
    for (let index = 0; index < config.count; index += 1) {
      const minLoanAmount = Math.floor(config.loanAmountRange[0]);
      const maxLoanAmount = Math.floor(config.loanAmountRange[1]);
      lenders.push({
        id: `lender-${type}-${index + 1}`, name: names[index % names.length], type,
        riskTolerance: inRange(random, config.riskToleranceRange), flexibility: inRange(random, config.flexibilityRange), marketPresence: inRange(random, [0.2, 1]),
        marketCapitalization: Math.floor(inRange(random, config.marketCapitalizationRange)), maxSingleBorrowerExposureRate: inRange(random, config.maxSingleBorrowerExposureRange), baseAnnualRate: inRange(random, config.baseAnnualRateRange),
        minLoanAmount, maxLoanAmount, minDurationPeriods: Math.floor(config.durationRange[0]), maxDurationPeriods: Math.floor(config.durationRange[1]),
        originationFeeBaseRate: inRange(random, config.originationFeeBaseRange), originationFeeMin: Math.max(5, Math.floor(minLoanAmount * 0.005)), originationFeeMax: Math.max(25, Math.floor(maxLoanAmount * 0.06)), blacklisted: false,
      });
    }
  }
  return lenders;
}

function normalizedCoverage(value: number, fair: number, good: number, excellent: number): number { if (!Number.isFinite(value) || value >= excellent) return 1; if (value >= good) return 0.67 + (value - good) / (excellent - good) * 0.33; if (value >= fair) return 0.33 + (value - fair) / (good - fair) * 0.34; return Math.max(0, value / fair * 0.33); }
function calculateStability(transactions: readonly FinanceTransaction[], companyAgeMs: number): CreditRatingBreakdown['companyStability'] {
  const periodNets = new Map<number, number>();
  for (const transaction of transactions.filter((entry) => entry.kind === 'operating')) { const bucket = Math.floor(transaction.occurredAtGameTimeMs / COMPANY_STABILITY_CONFIG.recentPeriodMs); periodNets.set(bucket, (periodNets.get(bucket) ?? 0) + transaction.amount); }
  const series = Array.from(periodNets.values()).slice(-COMPANY_STABILITY_CONFIG.recentPeriodCount);
  const mean = series.length === 0 ? 0 : series.reduce((sum, value) => sum + value, 0) / series.length;
  const deviation = series.length < 2 ? 0 : Math.sqrt(series.reduce((sum, value) => sum + (value - mean) ** 2, 0) / series.length);
  const observedConsistency = series.length < 2 ? COMPANY_STABILITY_CONFIG.starterConsistency : clamp01(1 - deviation / (Math.abs(mean) + 1));
  const profitabilityMultiplier = mean > 0 ? COMPANY_STABILITY_CONFIG.positiveProfitabilityMultiplier : mean < 0 ? COMPANY_STABILITY_CONFIG.negativeProfitabilityMultiplier : COMPANY_STABILITY_CONFIG.breakEvenProfitabilityMultiplier;
  const coverage = Math.min(1, series.length / COMPANY_STABILITY_CONFIG.recentPeriodCount);
  const profitConsistency = clamp01(observedConsistency * profitabilityMultiplier * coverage + COMPANY_STABILITY_CONFIG.starterConsistency * (1 - coverage));
  const income = transactions.filter((entry) => entry.kind === 'operating' && entry.amount > 0).reduce((sum, entry) => sum + entry.amount, 0);
  const expenses = transactions.filter((entry) => entry.kind === 'operating' && entry.amount < 0).reduce((sum, entry) => sum + Math.abs(entry.amount), 0);
  const expenseEfficiency = income > 0 ? clamp01((income - expenses) / income / COMPANY_STABILITY_CONFIG.healthyOperatingMargin) : 0;
  const companyAgeHours = Math.max(0, companyAgeMs) / (60 * 60_000);
  const ageScore = Math.sqrt(clamp01(companyAgeHours / COMPANY_STABILITY_CONFIG.ageTargetHours));
  const score = clamp01(ageScore * COMPANY_STABILITY_CONFIG.ageWeight + profitConsistency * COMPANY_STABILITY_CONFIG.consistencyWeight + expenseEfficiency * COMPANY_STABILITY_CONFIG.efficiencyWeight);
  return { companyAgeHours, profitConsistency, expenseEfficiency, score };
}

export function calculateCreditRating(input: { cash: number; totalAssets: number; fixedAssets: number; totalDebt: number; companyAgeMs: number; transactions: readonly FinanceTransaction[]; onTimePayments: number; missedPayments: number; paidOffLoans: number; defaults: number; consecutiveNegativePeriods?: number }): CreditRating {
  const debtToAssetRatio = input.totalDebt > 0 && input.totalAssets > 0 ? input.totalDebt / input.totalAssets : 0;
  const assetCoverage = input.totalDebt > 0 ? input.totalAssets / input.totalDebt : 999;
  const liquidityRatio = input.totalDebt > 0 ? input.cash / input.totalDebt : 999;
  const fixedAssetRatio = input.totalAssets > 0 ? input.fixedAssets / input.totalAssets : 0;
  const assetHealthScore = clamp01((debtToAssetRatio <= 0 ? 1 : debtToAssetRatio >= 1 ? 0 : 1 - debtToAssetRatio ** 1.5) * 0.35 + normalizedCoverage(assetCoverage, 1, 2, 4) * 0.3 + normalizedCoverage(liquidityRatio, 0.5, 1, 2) * 0.2 + normalizedCoverage(fixedAssetRatio, 0.2, 0.4, 0.6) * 0.15);
  const paymentHistoryScore = clamp01(1 - input.missedPayments * CREDIT_RATING_CONFIG.paymentHistoryMissPenalty - input.defaults * CREDIT_RATING_CONFIG.paymentHistoryDefaultPenalty);
  const companyStability = calculateStability(input.transactions, input.companyAgeMs);
  const consecutiveNegativePeriods = input.consecutiveNegativePeriods ?? 0;
  const penalty = Math.min(CREDIT_RATING_CONFIG.maxNegativePenalty, consecutiveNegativePeriods * 0.015);
  const weighted = CREDIT_RATING_CONFIG.base + assetHealthScore * CREDIT_RATING_CONFIG.weightAssetHealth * 0.35 + paymentHistoryScore * CREDIT_RATING_CONFIG.weightPaymentHistory * 0.35 + companyStability.score * CREDIT_RATING_CONFIG.weightCompanyStability * 0.25 - penalty;
  const score = clamp(weighted - clamp01(debtToAssetRatio) * 0.2, CREDIT_RATING_CONFIG.min, CREDIT_RATING_CONFIG.max);
  const grade = CREDIT_GRADE_THRESHOLDS.find((threshold) => score >= threshold.minimumScore)?.grade ?? 'CC';
  return { score, grade, breakdown: { baseRating: CREDIT_RATING_CONFIG.base, assetHealth: { debtToAssetRatio, assetCoverage, liquidityRatio, fixedAssetRatio, score: assetHealthScore }, paymentHistory: { onTimePayments: input.onTimePayments, missedPayments: input.missedPayments, paidOffLoans: input.paidOffLoans, defaults: input.defaults, score: paymentHistoryScore }, companyStability, negativeBalance: { consecutiveNegativePeriods, penalty } } };
}

function availabilityThreshold(lender: Lender): number { return clamp(lender.riskTolerance - lender.flexibility * 0.2, 0.15, 0.95); }
function policyCap(lender: Lender, totalAssets: number, score: number) { const config = LENDER_TYPE_CONFIG[lender.type]; const assetFactor = config.loanLimitAssetFactorBase + score * config.loanLimitAssetFactorScore; const ratingFactor = config.loanLimitRatingFactorBase + score * config.loanLimitRatingFactorScore; const assetCap = totalAssets * assetFactor; const ratingCap = totalAssets * ratingFactor; const marketCapLimit = lender.marketCapitalization * lender.maxSingleBorrowerExposureRate; const lenderContractLimit = Math.min(lender.maxLoanAmount, LOAN_TERMS.maximumAmount); return { assetFactor, ratingFactor, assetCap, ratingCap, marketCapLimit, lenderContractLimit, policyCap: Math.floor(Math.min(assetCap, ratingCap, marketCapLimit, lenderContractLimit)) }; }

export function calculateLoanLimitBreakdown(lenders: readonly Lender[], totalAssets: number, creditScore: number, loans: readonly Loan[]): LoanLimitBreakdown {
  const debt = outstandingBalance(loans);
  const lenderBreakdowns = lenders.map((lender): LenderLoanLimitBreakdown => {
    const threshold = availabilityThreshold(lender); const available = !lender.blacklisted && creditScore >= threshold; const cap = policyCap(lender, totalAssets, creditScore);
    return { lenderId: lender.id, lenderName: lender.name, lenderType: lender.type, isAvailable: available, unavailableReason: lender.blacklisted ? 'Lender has blacklisted the company.' : available ? null : `Requires ${Math.round(threshold * 100)}% credit`, availabilityThreshold: threshold, ...cap, marketCapitalization: lender.marketCapitalization, maxSingleBorrowerExposureRate: lender.maxSingleBorrowerExposureRate, outstandingBalance: debt, availableLimit: Math.max(0, cap.policyCap - debt) };
  });
  const caps = lenderBreakdowns.filter((item) => item.isAvailable).map((item) => item.policyCap);
  const grossBorrowingLimit = caps.length > 0 ? Math.floor(Math.max(...caps)) : 0;
  return { totalAssets, creditScore, grossBorrowingLimit, outstandingBalance: debt, availableBorrowingLimit: Math.max(0, grossBorrowingLimit - debt), lenderBreakdowns };
}

function payment(principal: number, periodicRate: number, periods: number): number { if (periodicRate <= 0) return principal / periods; const numerator = principal * periodicRate * (1 + periodicRate) ** periods; return numerator / ((1 + periodicRate) ** periods - 1); }
function offerForLender(lender: Lender, amount: number, periods: number, creditScore: number, economyPhase: EconomyPhase, limit: LenderLoanLimitBreakdown): LoanOffer {
  const principal = clamp(Math.floor(amount), lender.minLoanAmount, Math.min(lender.maxLoanAmount, limit.availableLimit)); const durationPeriods = clamp(Math.floor(periods), lender.minDurationPeriods, lender.maxDurationPeriods);
  const annualInterestRate = clamp((lender.baseAnnualRate + Math.max(0, lender.riskTolerance + LENDER_OFFER_CONFIG.minCreditGapTolerance - creditScore) * 0.08 - lender.flexibility * 0.015) * ECONOMY_INTEREST_MULTIPLIERS[economyPhase], LOAN_TERMS.minAnnualRate, LOAN_TERMS.maxAnnualRate);
  const periodicInterestRate = annualInterestRate / 52; const paymentAmount = payment(principal, periodicInterestRate, durationPeriods); const totalRepayment = paymentAmount * durationPeriods; const totalInterest = Math.max(0, totalRepayment - principal); const originationFee = clamp(principal * (lender.originationFeeBaseRate + (1 - creditScore) * 0.015), lender.originationFeeMin, lender.originationFeeMax);
  return { id: `offer-${lender.id}-${principal}-${durationPeriods}`, lenderId: lender.id, lenderName: lender.name, lenderType: lender.type, principal, durationPeriods, annualInterestRate, periodicInterestRate, paymentAmount, originationFee, totalRepayment, totalInterest, totalCost: totalInterest + originationFee, isAvailable: limit.isAvailable && limit.availableLimit >= lender.minLoanAmount, unavailableReason: limit.unavailableReason, paymentIntervalMs: LOAN_PAYMENT_INTERVAL_MS };
}

/**
 * Mirrors Winemaker's lender-search quote: each extra offer and each narrowed
 * filter raises both the fee and the foreground work required to find offers.
 */
export function calculateLoanSearchEstimate(criteria: LoanSearchCriteria, totalLenderTypeCount: number): LoanSearchEstimate {
  const lenderTypes = criteria.lenderTypes;
  const regularLenderTypeCount = Math.max(1, totalLenderTypeCount - 1);
  const selectedRegularTypes = lenderTypes.length === 0 ? regularLenderTypeCount : lenderTypes.filter((type) => type !== 'quickloan').length;
  const offers = clamp(Math.floor(criteria.offerCount), 1, LENDER_OFFER_CONFIG.maximumOfferCount);
  const offerMultiplier = offers <= 5 ? 1 + (offers - 1) * 0.3 : 2.2 + (offers - 5) * 0.3;
  const quickloanOnly = lenderTypes.length > 0 && lenderTypes.every((type) => type === 'quickloan');
  const typeNarrowness = clamp01((regularLenderTypeCount - selectedRegularTypes) / Math.max(1, regularLenderTypeCount - 1));
  const lenderTypeMultiplier = quickloanOnly ? 1 : 1 + typeNarrowness * LENDER_SEARCH_CONFIG.maximumTypeFilterWorkBonus;
  const amountRangeMultiplier = 1 + clamp01(1 - (criteria.amountMax - criteria.amountMin) / Math.max(1, LOAN_TERMS.maximumAmount - LOAN_TERMS.minimumAmount));
  const durationRangeMultiplier = 1 + clamp01(1 - (criteria.durationMaxPeriods - criteria.durationMinPeriods) / Math.max(1, LOAN_TERMS.maximumDurationPeriods - LOAN_TERMS.minimumDurationPeriods));
  const complexity = offerMultiplier * lenderTypeMultiplier * amountRangeMultiplier * durationRangeMultiplier;
  const activeParameterCount = Number(typeNarrowness > 0) + Number(amountRangeMultiplier > 1) + Number(durationRangeMultiplier > 1) + Number(offers > 1);
  const cost = quickloanOnly ? 0 : Math.round(LENDER_SEARCH_CONFIG.baseCost + LENDER_SEARCH_CONFIG.costPerActiveParameter * activeParameterCount * complexity ** LENDER_SEARCH_CONFIG.costSelectivityExponent);
  const workRequiredMs = Math.max(1_000, Math.round(LENDER_SEARCH_CONFIG.baseWorkMs * complexity * (quickloanOnly ? LENDER_SEARCH_CONFIG.quickloanOnlyWorkMultiplier : 1)));
  return { cost, workRequiredMs, offerMultiplier, lenderTypeMultiplier, amountRangeMultiplier, durationRangeMultiplier };
}
export function generateLoanOffers(input: { lenders: readonly Lender[]; limitBreakdown: LoanLimitBreakdown; creditRating: CreditRating; economyPhase: EconomyPhase; criteria: LoanSearchCriteria }): LoanOffer[] {
  const types = input.criteria.lenderTypes.length > 0 ? new Set(input.criteria.lenderTypes) : new Set(input.lenders.map((lender) => lender.type)); const byLender = new Map(input.limitBreakdown.lenderBreakdowns.map((entry) => [entry.lenderId, entry]));
  return input.lenders.filter((lender) => types.has(lender.type)).map((lender) => { const limit = byLender.get(lender.id); if (!limit) return null; const minimum = Math.max(lender.minLoanAmount, input.criteria.amountMin); const maximum = Math.min(lender.maxLoanAmount, input.criteria.amountMax, limit.availableLimit); const minTerm = Math.max(lender.minDurationPeriods, input.criteria.durationMinPeriods); const maxTerm = Math.min(lender.maxDurationPeriods, input.criteria.durationMaxPeriods); if (minimum > maximum || minTerm > maxTerm) return null; return offerForLender(lender, Math.floor((minimum + maximum) / 2), Math.floor((minTerm + maxTerm) / 2), input.creditRating.score, input.economyPhase, limit); }).filter((offer): offer is LoanOffer => offer !== null).sort((left, right) => (left.isAvailable === right.isAvailable ? left.totalCost - right.totalCost : left.isAvailable ? -1 : 1)).slice(0, clamp(Math.floor(input.criteria.offerCount), 1, LENDER_OFFER_CONFIG.maximumOfferCount));
}

/** Rechecks saved quotes after debt changes without replacing the search results. */
export function refreshLoanOfferAvailability(offers: readonly LoanOffer[], limitBreakdown: LoanLimitBreakdown): LoanOffer[] {
  const limits = new Map(limitBreakdown.lenderBreakdowns.map((limit) => [limit.lenderId, limit]));
  return offers.map((offer) => {
    const limit = limits.get(offer.lenderId);
    const unavailableReason = !limit ? 'Lender is no longer available.' : !limit.isAvailable ? limit.unavailableReason ?? 'Lender is no longer eligible.' : limit.availableLimit < offer.principal ? 'Requested principal exceeds the lender’s remaining limit.' : null;
    return { ...offer, isAvailable: unavailableReason === null, unavailableReason };
  });
}

export function estimatePrepaymentPenalty(loan: Loan): number { if (loan.status !== 'active') return 0; return Math.floor(clamp(loan.remainingBalance * ADVANCED_LOAN_CONFIG.prepaymentPenaltyRate, ADVANCED_LOAN_CONFIG.prepaymentPenaltyMin, loan.remainingBalance * ADVANCED_LOAN_CONFIG.prepaymentPenaltyMaxRate)); }

/** Scheduled interest still due if the loan continues through its remaining foreground-minute payments. */
export function estimateRemainingLoanInterest(loan: Loan): number { return loan.status === 'active' ? Math.max(0, loan.paymentAmount * loan.remainingPeriods - loan.remainingBalance) : 0; }
