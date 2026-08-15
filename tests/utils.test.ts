import { describe, expect, it } from 'vitest';
import { getColorClass, getNormalizedScoreLabel, normalizeToUnitInterval } from '@/utils';

describe('score presentation helpers', () => {
  it('normalizes bounded display ranges into the 0–1 colour scale', () => {
    expect(normalizeToUnitInterval(0.55, 0.55, 2)).toBe(0);
    expect(normalizeToUnitInterval(2, 0.55, 2)).toBe(1);
    expect(normalizeToUnitInterval(1.275, 0.55, 2)).toBeCloseTo(0.5);
    expect(normalizeToUnitInterval(5, 0.55, 2)).toBe(1);
  });

  it('uses the shared red-to-green scale for normalized ratings', () => {
    expect(getColorClass(0)).toBe('#B3261E');
    expect(getColorClass(0.5)).toBe('#7CB342');
    expect(getColorClass(1)).toBe('#1B5E20');
  });

  it('uses ten named bands for normalized scores', () => {
    expect(getNormalizedScoreLabel(0)).toBe('Critical');
    expect(getNormalizedScoreLabel(0.5)).toBe('Healthy');
    expect(getNormalizedScoreLabel(0.99)).toBe('Exceptional');
  });
});
