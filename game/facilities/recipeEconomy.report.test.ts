import { describe, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FACILITIES } from '@/game/facilities/facilityConstants';
import { getRecipeDisplayName, RecipeName } from '@/game/recipes';
import { getLocalMarketDepthMultiplier, getLocalRegionalDiffusionMultiplier, getRecipeResearchProjectId, getResearchProject } from '@/game/research';
import {
  RECIPE_ECONOMY_BREAK_EVEN_HORIZON_MINUTES,
  RECIPE_ECONOMY_EXTENDED_WINDOW_MINUTES,
  RECIPE_ECONOMY_LONG_WINDOW_MINUTES,
  RECIPE_ECONOMY_SHORT_WINDOW_MINUTES,
  simulateRecipeEconomy,
} from './recipeEconomy';

const UPGRADE_LEVELS = [0, 1, 3, 5, 10] as const;
const MARKET_RESEARCH_SCENARIOS = [
  { label: 'Baseline', localDepthLevel: 0, diffusionLevel: 0 },
  { label: 'Local depth I', localDepthLevel: 1, diffusionLevel: 0 },
  { label: 'Diffusion I', localDepthLevel: 0, diffusionLevel: 1 },
  { label: 'Networks III', localDepthLevel: 3, diffusionLevel: 3 },
  { label: 'Networks V', localDepthLevel: 5, diffusionLevel: 5 },
  { label: 'Networks X', localDepthLevel: 10, diffusionLevel: 10 },
] as const;
const RECIPE_WINDOW_SCENARIOS = [
  { label: 'Baseline', localDepthLevel: 0, diffusionLevel: 0 },
  { label: 'Networks III (3/3)', localDepthLevel: 3, diffusionLevel: 3 },
] as const;
const PORTFOLIO_NETWORK_SCENARIOS = [
  { label: 'Baseline', localDepthLevel: 0, diffusionLevel: 0 },
  { label: 'Networks I (1/1)', localDepthLevel: 1, diffusionLevel: 1 },
  { label: 'Networks III (3/3)', localDepthLevel: 3, diffusionLevel: 3 },
  { label: 'Networks V (5/5)', localDepthLevel: 5, diffusionLevel: 5 },
  { label: 'Networks X (10/10)', localDepthLevel: 10, diffusionLevel: 10 },
] as const;

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

function marketResearchProjectIds(localDepthLevel: number, diffusionLevel: number): string[] {
  return [
    ...Array.from({ length: localDepthLevel }, (_, index) => `local-market-network-${index + 1}`),
    ...Array.from({ length: diffusionLevel }, (_, index) => `market-diffusion-network-${index + 1}`),
  ];
}

function marketResearchCost(projectIds: readonly string[]): number {
  return projectIds.reduce((total, projectId) => total + (getResearchProject(projectId)?.cost ?? 0), 0);
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
    const recipeRows = grouped(entries, (entry) => RECIPE_WINDOW_SCENARIOS.map((scenario) => {
      const recipeName = entry.recipeName;
      const completedResearchProjectIds = marketResearchProjectIds(scenario.localDepthLevel, scenario.diffusionLevel);
      const initial = simulateRecipeEconomy({ recipeName, durationMinutes: 1, completedResearchProjectIds });
      const shortRun = simulateRecipeEconomy({ recipeName, durationMinutes: RECIPE_ECONOMY_SHORT_WINDOW_MINUTES, completedResearchProjectIds });
      const longRun = simulateRecipeEconomy({ recipeName, durationMinutes: RECIPE_ECONOMY_LONG_WINDOW_MINUTES, completedResearchProjectIds });
      const extendedRun = simulateRecipeEconomy({ recipeName, durationMinutes: RECIPE_ECONOMY_EXTENDED_WINDOW_MINUTES, completedResearchProjectIds });
      const horizon = simulateRecipeEconomy({ recipeName, durationMinutes: RECIPE_ECONOMY_BREAK_EVEN_HORIZON_MINUTES, completedResearchProjectIds });
      return {
        recipe: entry.recipe,
        scenario: scenario.label,
        facilityCost: money(initial.facilityInvestmentCost),
        recipeResearchCost: money(getResearchProject(getRecipeResearchProjectId(recipeName))?.cost ?? 0),
        marketResearchCost: money(marketResearchCost(completedResearchProjectIds)),
        initialMargin: money(initial.initialNetMarginPerMinute),
        margin15m: money(shortRun.netMarginPerMinute),
        margin60m: money(longRun.netMarginPerMinute),
        margin180m: money(extendedRun.netMarginPerMinute),
        outputPriceDropPerUnit: money(initial.initialOutputUnitPrice - longRun.finalOutputUnitPrice),
        outputPriceDropPercent: initial.initialOutputUnitPrice > 0
          ? `${(((initial.initialOutputUnitPrice - longRun.finalOutputUnitPrice) / initial.initialOutputUnitPrice) * 100).toFixed(1)}%`
          : '0.0%',
        maintenance60m: money(longRun.totalMaintenanceCost),
        breakEven: minute(horizon.breakEvenMinute),
        payback: minute(horizon.paybackMinute),
      };
    }));
    console.log('\nRecipe economy: one fully staffed facility, local input purchases, local output sales, 70% repair threshold');
    for (const [facility, rows] of recipeRows) {
      const flatRows = rows.flat();
      console.log(`\n${facility}`);
      console.table(flatRows);
      reportSections.push(`## ${facility}`, '', 'Networks III (3/3) applies Local Market Network III and Market Diffusion Network III before production begins.', '', markdownTable(flatRows), '');
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

    for (const [facility, entriesForFacility] of grouped(entries, (entry) => entry)) {
      const marketScenarioRows = entriesForFacility.flatMap((entry) => MARKET_RESEARCH_SCENARIOS.map((scenario) => {
        const completedResearchProjectIds = marketResearchProjectIds(scenario.localDepthLevel, scenario.diffusionLevel);
        const result = simulateRecipeEconomy({
          recipeName: entry.recipeName,
          durationMinutes: RECIPE_ECONOMY_LONG_WINDOW_MINUTES,
          completedResearchProjectIds,
        });
        return {
          recipe: entry.recipe,
          scenario: scenario.label,
          localDepth: `${getLocalMarketDepthMultiplier(completedResearchProjectIds).toFixed(1)}x`,
          localRegionalDiffusion: `${getLocalRegionalDiffusionMultiplier(completedResearchProjectIds).toFixed(2)}x`,
          cumulativeResearchCost: money(marketResearchCost(completedResearchProjectIds)),
          margin60m: money(result.netMarginPerMinute),
          outputPriceDropPercent: result.initialOutputUnitPrice > 0
            ? `${(((result.initialOutputUnitPrice - result.finalOutputUnitPrice) / result.initialOutputUnitPrice) * 100).toFixed(1)}%`
            : '0.0%',
          breakEven: minute(result.breakEvenMinute),
        };
      }));
      console.log(`\nMarket research comparison (60 minutes): ${facility}`);
      console.table(marketScenarioRows);
      reportSections.push(`## Market research comparison (60 minutes): ${facility}`, '', 'Local depth expands local supply without changing its starting price. Diffusion increases only local-regional balancing. Research cost is cumulative through the shown tier.', '', markdownTable(marketScenarioRows), '');
    }

    const portfolioRows = PORTFOLIO_NETWORK_SCENARIOS.map((scenario) => {
      const completedResearchProjectIds = marketResearchProjectIds(scenario.localDepthLevel, scenario.diffusionLevel);
      const totalNetProfit = entries.reduce((total, entry) => {
        const result = simulateRecipeEconomy({
          recipeName: entry.recipeName,
          durationMinutes: RECIPE_ECONOMY_EXTENDED_WINDOW_MINUTES,
          completedResearchProjectIds,
        });
        return total + result.totalRevenue - result.totalInputCost - result.totalMaintenanceCost;
      }, 0);
      return {
        scenario: scenario.label,
        localDepth: `${getLocalMarketDepthMultiplier(completedResearchProjectIds).toFixed(1)}x`,
        localRegionalDiffusion: `${getLocalRegionalDiffusionMultiplier(completedResearchProjectIds).toFixed(2)}x`,
        cumulativeResearchCost: marketResearchCost(completedResearchProjectIds),
        netProfit180m: totalNetProfit,
      };
    });
    const baselinePortfolioNetProfit = portfolioRows[0]!.netProfit180m;
    const portfolioPaybackRows = portfolioRows.map((row) => {
      const incrementalNetProfit180m = row.netProfit180m - baselinePortfolioNetProfit;
      return {
        scenario: row.scenario,
        localDepth: row.localDepth,
        localRegionalDiffusion: row.localRegionalDiffusion,
        cumulativeResearchCost: money(row.cumulativeResearchCost),
        portfolioNetProfit180m: money(row.netProfit180m),
        incrementalNetProfit180m: money(incrementalNetProfit180m),
        incrementalMarginPerMinute: money(incrementalNetProfit180m / RECIPE_ECONOMY_EXTENDED_WINDOW_MINUTES),
        networkPaybackEstimateMinutes: upgradePaybackEstimate(row.cumulativeResearchCost, incrementalNetProfit180m / RECIPE_ECONOMY_EXTENDED_WINDOW_MINUTES),
      };
    });
    console.log('\nMarket network portfolio payback (180 minutes)');
    console.table(portfolioPaybackRows);
    reportSections.push('## Market network portfolio payback (180 minutes)', '', 'One continuously selling facility per recipe. Results sum the independent recipe simulations, while each network cost is paid once. This isolates company-wide research value; it is not a shared-market multi-facility simulation.', '', markdownTable(portfolioPaybackRows), '');
    const reportPath = process.env.RECIPE_ECONOMY_REPORT_PATH;
    if (reportPath) {
      writeFileSync(reportPath, `${reportSections.join('\n')}\n`, 'utf8');
      console.log(`\nMarkdown report written to ${reportPath}`);
    }
  }, 30_000);
});
