import { describe, expect, it } from 'vitest';
import { normalizeCompanyPrestigeForPresentation } from '@/game/prestige';

describe('prestige presentation score', () => {
  it('maps unbounded prestige onto a bounded, increasing display score', () => {
    expect(normalizeCompanyPrestigeForPresentation(-1)).toBe(0);
    expect(normalizeCompanyPrestigeForPresentation(0)).toBe(0);
    expect(normalizeCompanyPrestigeForPresentation(100)).toBeCloseTo(0.5);
    expect(normalizeCompanyPrestigeForPresentation(1_000)).toBeGreaterThan(0.9);
  });
});
