import { describe, expect, it } from 'vitest';
import { Finance, LENDER_TYPES, LOAN_TERMS, type LoanOffer } from '@/game/finance';
import { calculateLoanSearchEstimate } from '@/game/finance/loanService';

function offer(id: string): LoanOffer {
  return { id, lenderId: id, lenderName: id, lenderType: 'bank', principal: 100, durationPeriods: 5, annualInterestRate: 0.06, periodicInterestRate: 0.06 / 52, paymentAmount: 21, originationFee: 0, totalRepayment: 105, totalInterest: 5, totalCost: 5, isAvailable: true, unavailableReason: null, paymentIntervalMs: 60_000 };
}

describe('lender searches', () => {
  it('multiplies each narrowed non-quickloan criterion while leaving a quickloan-only search free', () => {
    const broad = calculateLoanSearchEstimate({ lenderTypes: [], amountMin: LOAN_TERMS.minimumAmount, amountMax: LOAN_TERMS.maximumAmount, durationMinPeriods: LOAN_TERMS.minimumDurationPeriods, durationMaxPeriods: LOAN_TERMS.maximumDurationPeriods, offerCount: 1 }, LENDER_TYPES.length);
    const narrow = calculateLoanSearchEstimate({ lenderTypes: ['bank'], amountMin: 50, amountMax: 50, durationMinPeriods: 5, durationMaxPeriods: 5, offerCount: 10 }, LENDER_TYPES.length);
    const quickloan = calculateLoanSearchEstimate({ lenderTypes: ['quickloan'], amountMin: 50, amountMax: 50, durationMinPeriods: 5, durationMaxPeriods: 5, offerCount: 10 }, LENDER_TYPES.length);

    expect(broad.cost).toBe(10);
    expect(narrow.cost).toBeGreaterThan(4_800);
    expect(narrow.workRequiredMs).toBeGreaterThan(broad.workRequiredMs * 20);
    expect(quickloan.cost).toBe(0);
  });

  it('adds a cost tier for each activated search parameter', () => {
    const typeOnly = calculateLoanSearchEstimate({ lenderTypes: ['bank'], amountMin: LOAN_TERMS.minimumAmount, amountMax: LOAN_TERMS.maximumAmount, durationMinPeriods: LOAN_TERMS.minimumDurationPeriods, durationMaxPeriods: LOAN_TERMS.maximumDurationPeriods, offerCount: 1 }, LENDER_TYPES.length);

    expect(typeOnly.cost).toBe(52);
  });

  it('consumes only the accepted search result', () => {
    const finance = new Finance();
    const accepted = offer('accepted');
    const remaining = offer('remaining');
    finance.completeLoanSearch([accepted, remaining], 2, 0);

    expect(finance.acceptLoan(accepted, 0)?.id).toBe('loan-1');
    expect(finance.getLoanSearchOffers()).toEqual([remaining]);
  });

  it('retains an explicit completed-search result when no lender can quote', () => {
    const finance = new Finance();

    finance.completeLoanSearch([], 3, 60_000);

    expect(finance.getLastLoanSearchResult()).toEqual({ requestedOfferCount: 3, foundOfferCount: 0, availableOfferCount: 0, completedAtGameTimeMs: 60_000 });
  });

  it('removes only unavailable search results when dismissed', () => {
    const finance = new Finance();
    const unavailable = { ...offer('unavailable'), isAvailable: false, unavailableReason: 'Lender limit reached.' };
    const available = offer('available');
    finance.completeLoanSearch([unavailable, available], 2, 0);

    expect(finance.removeUnavailableLoanSearchOffers()).toBe(1);
    expect(finance.getLoanSearchOffers()).toEqual([available]);
  });

  it('removes one selected search result', () => {
    const finance = new Finance();
    const first = offer('first');
    const second = offer('second');
    finance.completeLoanSearch([first, second], 2, 0);

    expect(finance.removeLoanSearchOffer(first.id)).toBe(true);
    expect(finance.getLoanSearchOffers()).toEqual([second]);
  });
});
