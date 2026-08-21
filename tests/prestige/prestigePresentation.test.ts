import { describe, expect, it } from 'vitest';
import { calculateSalesOrderPrestige, normalizeCompanyPrestigeForPresentation } from '@/game/prestige';

describe('prestige presentation score', () => {
  it('maps unbounded prestige onto a bounded, increasing display score', () => {
    expect(normalizeCompanyPrestigeForPresentation(-1)).toBe(0);
    expect(normalizeCompanyPrestigeForPresentation(0)).toBe(0);
    expect(normalizeCompanyPrestigeForPresentation(100)).toBeCloseTo(0.5);
    expect(normalizeCompanyPrestigeForPresentation(1_000)).toBeGreaterThan(0.9);
  });
});

describe('sales-order prestige', () => {
  it('spreads prestige across order-value tiers with a €1m reference point', () => {
    expect(calculateSalesOrderPrestige(100)).toBe(0.01);
    expect(calculateSalesOrderPrestige(1_000)).toBeCloseTo(2.5075, 4);
    expect(calculateSalesOrderPrestige(10_000)).toBeCloseTo(5.005, 4);
    expect(calculateSalesOrderPrestige(100_000)).toBeCloseTo(7.5025, 4);
    expect(calculateSalesOrderPrestige(1_000_000)).toBe(10);
    expect(calculateSalesOrderPrestige(10_000_000)).toBeGreaterThan(10);
  });
});
