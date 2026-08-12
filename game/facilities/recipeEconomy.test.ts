import { describe, expect, it } from 'vitest';
import { RecipeName } from '@/game/recipes';
import {
  RECIPE_ECONOMY_BREAK_EVEN_HORIZON_MINUTES,
  RECIPE_ECONOMY_LONG_WINDOW_MINUTES,
  RECIPE_ECONOMY_REPAIR_THRESHOLD,
  RECIPE_ECONOMY_SHORT_WINDOW_MINUTES,
  simulateRecipeEconomy,
} from './recipeEconomy';

const RECIPE_NAMES = Object.values(RecipeName);
const UPGRADE_LEVELS = [0, 1, 3, 5, 10] as const;

describe('recipe economy simulation', () => {
  it.each(RECIPE_NAMES)('%s is initially profitable and reports finite 15-minute and 60-minute economics', (recipeName) => {
    const initial = simulateRecipeEconomy({ recipeName, durationMinutes: 1 });
    const shortRun = simulateRecipeEconomy({ recipeName, durationMinutes: RECIPE_ECONOMY_SHORT_WINDOW_MINUTES });
    const longRun = simulateRecipeEconomy({ recipeName, durationMinutes: RECIPE_ECONOMY_LONG_WINDOW_MINUTES });

    expect(Number.isFinite(initial.initialNetMarginPerMinute)).toBe(true);
    expect(Number.isFinite(shortRun.netMarginPerMinute)).toBe(true);
    expect(Number.isFinite(longRun.netMarginPerMinute)).toBe(true);
    expect(initial.initialNetMarginPerMinute).toBeGreaterThan(0);
    expect(shortRun.netMarginPerMinute).toBeGreaterThan(0);
    expect(longRun.totalMaintenanceCost).toBeGreaterThanOrEqual(0);
    expect(longRun.facilityInvestmentCost).toBeGreaterThan(0);
  });

  it('captures a profitable initial Grain market and a lower sustained selling margin', () => {
    const initial = simulateRecipeEconomy({ recipeName: RecipeName.GrowGrain, durationMinutes: 1 });
    const longRun = simulateRecipeEconomy({ recipeName: RecipeName.GrowGrain, durationMinutes: RECIPE_ECONOMY_LONG_WINDOW_MINUTES });

    expect(initial.initialNetMarginPerMinute).toBeGreaterThan(0);
    expect(longRun.netMarginPerMinute).toBeLessThan(initial.initialNetMarginPerMinute);
    expect(longRun.finalOutputUnitPrice).toBeLessThan(initial.initialOutputUnitPrice);
  });

  it('keeps several recipes profitable after 60 minutes while allowing market saturation', () => {
    const profitableRecipes = RECIPE_NAMES.filter((recipeName) => (
      simulateRecipeEconomy({ recipeName, durationMinutes: RECIPE_ECONOMY_LONG_WINDOW_MINUTES }).netMarginPerMinute > 0
    ));

    expect(profitableRecipes.length).toBeGreaterThanOrEqual(5);
  });

  it.each(UPGRADE_LEVELS)('reports the grain economy at upgrade level %i', (speedUpgradeLevel) => {
    const result = simulateRecipeEconomy({ recipeName: RecipeName.GrowGrain, durationMinutes: RECIPE_ECONOMY_SHORT_WINDOW_MINUTES, speedUpgradeLevel });

    expect(result.totalMaintenanceCost).toBeGreaterThan(0);
    expect(result.averageCondition).toBeGreaterThan(RECIPE_ECONOMY_REPAIR_THRESHOLD);
    expect(result.upgradeInvestmentCost).toBeGreaterThanOrEqual(0);
  });

  it('reports a break-even minute when one occurs within the diagnostic horizon', () => {
    const result = simulateRecipeEconomy({ recipeName: RecipeName.GrowGrain, durationMinutes: RECIPE_ECONOMY_BREAK_EVEN_HORIZON_MINUTES });

    expect(result.breakEvenMinute === null || result.breakEvenMinute <= RECIPE_ECONOMY_BREAK_EVEN_HORIZON_MINUTES).toBe(true);
  });
});
