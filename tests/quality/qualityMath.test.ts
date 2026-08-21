import { describe, expect, it } from 'vitest';
import {
  calculateInputMaxQ,
  calculateOutputQuality,
  calculateProductionMaxQ,
  calculateQualityFromProgress,
  calculateResearchMaxQ,
  calculateUpgradeMaxQ,
  calculateWeightedInputQ,
} from '@/game/quality';

describe('quality domain', () => {
  it('uses one diminishing curve for research and facility levels', () => {
    expect(calculateResearchMaxQ(0)).toBe(1);
    expect(calculateResearchMaxQ(1)).toBe(2);
    expect(calculateUpgradeMaxQ(1)).toBe(1);
    expect(calculateUpgradeMaxQ(2)).toBe(2);
    expect(calculateResearchMaxQ(40)).toBeGreaterThan(calculateResearchMaxQ(20));
    expect(calculateResearchMaxQ(1_000)).toBeLessThan(100);
  });

  it('keeps the tuned mid- and late-game curve milestones stable', () => {
    expect(calculateResearchMaxQ(40)).toBeCloseTo(44.9713, 3);
    expect(calculateProductionMaxQ(207_500)).toBeCloseTo(49.7208, 3);
    expect(calculateProductionMaxQ(10_000_000)).toBeCloseTo(99.6717, 3);
  });

  it('normalizes lifetime production continuously and remains below Q100', () => {
    expect(calculateProductionMaxQ(0)).toBe(1);
    expect(calculateProductionMaxQ(100)).toBe(2);
    expect(calculateProductionMaxQ(100_000)).toBeGreaterThan(calculateProductionMaxQ(10_000));
    expect(calculateProductionMaxQ(Number.MAX_VALUE)).toBeLessThan(100);
    expect(calculateQualityFromProgress(Number.MAX_VALUE)).toBeLessThan(100);
  });

  it('calculates the input ceiling from a quantity-weighted average', () => {
    const inputQ = calculateWeightedInputQ([
      { amount: 1, quality: 2 },
      { amount: 3, quality: 6 },
    ]);
    expect(inputQ).toBe(5);
    expect(calculateInputMaxQ(inputQ)).toBe(6);
    expect(calculateInputMaxQ(null)).toBe(Number.POSITIVE_INFINITY);
  });

  it('returns a breakdown and applies the minimum of all four ceilings', () => {
    const breakdown = calculateOutputQuality({
      inputMaxQ: 9,
      researchMaxQ: 8,
      upgradeMaxQ: 7,
      productionMaxQ: 6,
    });
    expect(breakdown).toEqual({ inputMaxQ: 9, researchMaxQ: 8, upgradeMaxQ: 7, productionMaxQ: 6, outputQ: 6 });
  });

  it('does not apply or display an input ceiling when a recipe has no inputs', () => {
    const breakdown = calculateOutputQuality({
      weightedInputQ: null,
      researchMaxQ: 20,
      upgradeMaxQ: 20,
      productionMaxQ: 20,
    });

    expect(breakdown.inputMaxQ).toBe(Number.POSITIVE_INFINITY);
    expect(breakdown.outputQ).toBe(20);
  });
});
