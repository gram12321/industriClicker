import { describe, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FACILITIES } from '@/game/facilities/facilityConstants';
import { getRecipeDisplayName, RecipeName } from '@/game/recipes';
import { getRecipeResearchProjectId, getResearchProject } from '@/game/research';
import {
  RECIPE_ECONOMY_BREAK_EVEN_HORIZON_MINUTES,
  RECIPE_ECONOMY_LONG_WINDOW_MINUTES,
  RECIPE_ECONOMY_SHORT_WINDOW_MINUTES,
  simulateRecipeEconomy,
} from './recipeEconomy';

const UPGRADE_LEVELS = [0, 1, 3, 5, 10] as const;

function money(value: number): string {
  return value.toFixed(2);
}

function minute(value: number | null): string {
  return value === null ? 'not reached' : String(value);
}

function upgradePaybackEstimate(upgradeCost: number, incrementalMarginPerMinute: number): string {
  if (upgradeCost <= 0) return 'n/a';
  if (incrementalMarginPerMinute <= 0) return 'not profitable';
  return String(Math.ceil(upgradeCost / incrementalMarginPerMinute));
}

function markdownTable(rows: ReadonlyArray<Record<string, string | number>>): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]!);
  const lines = [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${headers.map((header) => String(row[header] ?? '')).join(' | ')} |`),
  ];
  return lines.join('\n');
}

type RecipeReportEntry = {
  facility: string;
  recipeName: RecipeName;
  recipe: string;
};

function recipeEntries(): RecipeReportEntry[] {
  return Object.values(FACILITIES).flatMap((facility) => facility.recipes.map((recipe) => ({
    facility: facility.name,
    recipeName: recipe.name,
    recipe: getRecipeDisplayName(recipe.name),
  }))).sort((left, right) => left.facility.localeCompare(right.facility) || left.recipe.localeCompare(right.recipe));
}

function grouped<T>(entries: readonly RecipeReportEntry[], makeRow: (entry: RecipeReportEntry) => T): Map<string, T[]> {
  const result = new Map<string, T[]>();
  for (const entry of entries) {
    const rows = result.get(entry.facility) ?? [];
    rows.push(makeRow(entry));
    result.set(entry.facility, rows);
  }
  return result;
}

describe('recipe economy report', () => {
  it('prints recipe economy tables when invoked by the report command', () => {
    if (process.env.RECIPE_ECONOMY_REPORT !== '1') return;

    const reportSections: string[] = [
      '# Recipe Economy Report',
      '',
      'One fully staffed facility, local input purchases, local output sales, normal market diffusion, and repairs at 70% condition. Initial margin is a full-cycle initial-market rate including expected maintenance; it does not treat input purchase timing as a loss.',
      '',
      '## Recipe windows',
      '',
    ];
    const entries = recipeEntries();
    const recipeRows = grouped(entries, (entry) => {
      const recipeName = entry.recipeName;
      const initial = simulateRecipeEconomy({ recipeName, durationMinutes: 1 });
      const shortRun = simulateRecipeEconomy({ recipeName, durationMinutes: RECIPE_ECONOMY_SHORT_WINDOW_MINUTES });
      const longRun = simulateRecipeEconomy({ recipeName, durationMinutes: RECIPE_ECONOMY_LONG_WINDOW_MINUTES });
      const horizon = simulateRecipeEconomy({ recipeName, durationMinutes: RECIPE_ECONOMY_BREAK_EVEN_HORIZON_MINUTES });
      return {
        recipe: entry.recipe,
        facilityCost: money(initial.facilityInvestmentCost),
        researchCost: money(getResearchProject(getRecipeResearchProjectId(recipeName))?.cost ?? 0),
        initialMargin: money(initial.initialNetMarginPerMinute),
        margin15m: money(shortRun.netMarginPerMinute),
        margin60m: money(longRun.netMarginPerMinute),
        outputPriceDropPerUnit: money(initial.initialOutputUnitPrice - longRun.finalOutputUnitPrice),
        outputPriceDropPercent: initial.initialOutputUnitPrice > 0
          ? `${(((initial.initialOutputUnitPrice - longRun.finalOutputUnitPrice) / initial.initialOutputUnitPrice) * 100).toFixed(1)}%`
          : '0.0%',
        maintenance60m: money(longRun.totalMaintenanceCost),
        breakEven: minute(horizon.breakEvenMinute),
        payback: minute(horizon.paybackMinute),
      };
    });
    console.log('\nRecipe economy: one fully staffed facility, local input purchases, local output sales, 70% repair threshold');
    for (const [facility, rows] of recipeRows) {
      console.log(`\n${facility}`);
      console.table(rows);
      reportSections.push(`## ${facility}`, '', markdownTable(rows), '');
    }

    for (const upgradeKind of ['speed', 'output'] as const) {
      console.log(`\n${upgradeKind[0]!.toUpperCase()}${upgradeKind.slice(1)} upgrade comparison (15 minutes; incremental payback estimate)`);
      const upgradeRows = grouped(entries, (entry) => {
        const baseResult = simulateRecipeEconomy({
          recipeName: entry.recipeName,
          durationMinutes: RECIPE_ECONOMY_SHORT_WINDOW_MINUTES,
        });
        return UPGRADE_LEVELS.map((level) => {
        const recipeName = entry.recipeName;
        const result = simulateRecipeEconomy({
          recipeName,
          durationMinutes: RECIPE_ECONOMY_SHORT_WINDOW_MINUTES,
          speedUpgradeLevel: upgradeKind === 'speed' ? level : 0,
          outputUpgradeLevel: upgradeKind === 'output' ? level : 0,
        });
        const incrementalMarginPerMinute = result.netMarginPerMinute - baseResult.netMarginPerMinute;
        return {
          recipe: entry.recipe,
          facilityCost: money(result.facilityInvestmentCost),
          researchCost: money(getResearchProject(getRecipeResearchProjectId(recipeName))?.cost ?? 0),
          level,
          marginPerMinute: money(result.netMarginPerMinute),
          incrementalMarginPerMinute: money(incrementalMarginPerMinute),
          upgradeCost: money(result.upgradeInvestmentCost),
          maintenance: money(result.totalMaintenanceCost),
          upgradePaybackEstimateMinutes: upgradePaybackEstimate(result.upgradeInvestmentCost, incrementalMarginPerMinute),
        };
        });
      });
      for (const [facility, rows] of upgradeRows) {
        const flatRows = rows.flat();
        console.log(`\n${facility}`);
        console.table(flatRows);
        reportSections.push(`## ${upgradeKind[0]!.toUpperCase()}${upgradeKind.slice(1)} upgrade comparison: ${facility}`, '', 'Upgrade payback is the upgrade investment divided by its additional 15-minute net margin.', '', markdownTable(flatRows), '');
      }
    }
    const reportPath = process.env.RECIPE_ECONOMY_REPORT_PATH;
    if (reportPath) {
      writeFileSync(reportPath, `${reportSections.join('\n')}\n`, 'utf8');
      console.log(`\nMarkdown report written to ${reportPath}`);
    }
  });
});
