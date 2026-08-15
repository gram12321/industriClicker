import { describe, expect, it } from 'vitest';
import { Finance, type LoanOffer } from '@/game/finance';

const offer: LoanOffer = { id: 'collection-loan', lenderId: 'lender-bank-1', lenderName: 'Test Bank', lenderType: 'bank', principal: 100, durationPeriods: 20, annualInterestRate: 0.06, periodicInterestRate: 0.06 / 52, paymentAmount: 6, originationFee: 0, totalRepayment: 120, totalInterest: 20, totalCost: 20, isAvailable: true, unavailableReason: null, paymentIntervalMs: 60_000 };

describe('loan collections', () => {
  it('escalates missed payments through warning, penalty, liquidation, and default', () => {
    const finance = new Finance();
    finance.completeLoanSearch([offer], 1, 0);
    expect(finance.acceptLoan(offer, 0)).not.toBeNull();
    expect(finance.applyTransaction({ amount: -300, description: 'Test withdrawal', detailLines: [], kind: 'equity', source: 'admin-adjustment', occurredAtGameTimeMs: 0 })).toBe(true);

    finance.advanceLoanAndEconomy(10 * 60_000);

    expect(finance.getCollectionNotices().map((notice) => notice.stage)).toEqual(['warning', 'penalty', 'liquidation', 'default']);
    expect(finance.getLoans()[0].status).toBe('defaulted');
    expect(finance.getLenders().find((lender) => lender.id === offer.lenderId)?.blacklisted).toBe(true);
    expect(finance.getPendingRestructureOffer()).not.toBeNull();
  });
});
