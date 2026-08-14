import { describe, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FACILITIES } from '@/game/facilities/facilityConstants';
import { getRecipeDisplayName, RecipeName } from '@/game/recipes';
import { getLocalMarketDepthMultiplier, getLocalRegionalDiffusionMultiplier, getRecipeResearchProjectId, getResearchProject } from '@/game/research';
import { getResource, ResourceType } from '@/game/resources';
import {
  RECIPE_ECONOMY_BREAK_EVEN_HORIZON_MINUTES,
  RECIPE_ECONOMY_EXTENDED_WINDOW_MINUTES,
  RECIPE_ECONOMY_LONG_WINDOW_MINUTES,
  RECIPE_ECONOMY_SHORT_WINDOW_MINUTES,
  type RecipeEconomyChainScenario,
  simulateRecipeEconomy,
  simulateRecipeEconomyChain,
} from '../support/recipeEconomy';

const RECIPE_WINDOW_SCENARIOS = [
  { label: 'Baseline', localDepthLevel: 0, diffusionLevel: 0 },
  { label: 'Networks III (3/3)', localDepthLevel: 3, diffusionLevel: 3 },
] as const;
const CHAIN_SCENARIOS: ReadonlyArray<{ label: string; scenario: RecipeEconomyChainScenario }> = [
  {
    label: 'Staples: utilities -> Grain',
    scenario: {
      facilities: [
        { recipeName: RecipeName.ProduceWater },
        { recipeName: RecipeName.ProduceElectricity },
        { recipeName: RecipeName.GrowGrain },
      ],
      durationMinutes: RECIPE_ECONOMY_EXTENDED_WINDOW_MINUTES,
      sellResourceTypes: [ResourceType.Water, ResourceType.Electricity, ResourceType.Grain],
    },
  },
  {
    label: 'Extraction: utilities -> Iron',
    scenario: {
      facilities: [
        { recipeName: RecipeName.ProduceWater },
        { recipeName: RecipeName.ProduceElectricity },
        { recipeName: RecipeName.MineIron },
      ],
      durationMinutes: RECIPE_ECONOMY_EXTENDED_WINDOW_MINUTES,
      sellResourceTypes: [ResourceType.Water, ResourceType.Electricity, ResourceType.Iron],
    },
  },
  {
    label: 'Fertilizer bridge: inputs -> Grain and Sugar',
    scenario: {
      facilities: [
        { recipeName: RecipeName.ProduceWater },
        { recipeName: RecipeName.ProduceElectricity },
        { recipeName: RecipeName.QuarryMinerals },
        { recipeName: RecipeName.ProduceChemicals },
        { recipeName: RecipeName.SynthesizeFertilizer },
        { recipeName: RecipeName.GrowGrain },
        { recipeName: RecipeName.GrowSugar },
      ],
      durationMinutes: RECIPE_ECONOMY_EXTENDED_WINDOW_MINUTES,
      sellResourceTypes: [
        ResourceType.Water,
        ResourceType.Electricity,
        ResourceType.Minerals,
        ResourceType.Chemicals,
        ResourceType.Fertilizer,
        ResourceType.Grain,
        ResourceType.Sugar,
      ],
    },
  },
  {
    label: 'Construction: inputs -> Construction Materials',
    scenario: {
      facilities: [
        { recipeName: RecipeName.ProduceWater },
        { recipeName: RecipeName.ProduceElectricity },
        { recipeName: RecipeName.MineCoal },
        { recipeName: RecipeName.MineIron },
        { recipeName: RecipeName.QuarryClay },
        { recipeName: RecipeName.QuarrySand },
        { recipeName: RecipeName.QuarryStone },
        { recipeName: RecipeName.ProduceSteel },
        { recipeName: RecipeName.ProduceBricks },
        { recipeName: RecipeName.ProduceCement },
        { recipeName: RecipeName.ProduceReinforcedConcrete },
        { recipeName: RecipeName.ProduceConstructionMaterials },
      ],
      durationMinutes: RECIPE_ECONOMY_EXTENDED_WINDOW_MINUTES,
      sellResourceTypes: [
        ResourceType.Water,
        ResourceType.Electricity,
        ResourceType.Coal,
        ResourceType.Iron,
        ResourceType.Clay,
        ResourceType.Sand,
        ResourceType.Stone,
        ResourceType.Steel,
        ResourceType.Bricks,
        ResourceType.Cement,
        ResourceType.ReinforcedConcrete,
        ResourceType.ConstructionMaterials,
      ],
      includeConstructionMaterialsDemand: true,
    },
  },
  {
    label: 'Industrial Machines: inputs -> Industrial Machines',
    scenario: {
      facilities: [
        { recipeName: RecipeName.ProduceWater },
        { recipeName: RecipeName.ProduceElectricity },
        { recipeName: RecipeName.QuarrySand },
        { recipeName: RecipeName.QuarryMinerals },
        { recipeName: RecipeName.ProduceChemicals },
        { recipeName: RecipeName.MineCoal },
        { recipeName: RecipeName.MineIron },
        { recipeName: RecipeName.MineCopper },
        { recipeName: RecipeName.MineGold },
        { recipeName: RecipeName.ProducePlastic },
        { recipeName: RecipeName.ProduceSilicon },
        { recipeName: RecipeName.ProduceSteel },
        { recipeName: RecipeName.ProduceElectricCircuits },
        { recipeName: RecipeName.ProduceAdvancedComponents },
        { recipeName: RecipeName.AssembleIndustrialMachines },
      ],
      durationMinutes: RECIPE_ECONOMY_EXTENDED_WINDOW_MINUTES,
      sellResourceTypes: [
        ResourceType.Water,
        ResourceType.Electricity,
        ResourceType.Sand,
        ResourceType.Minerals,
        ResourceType.Chemicals,
        ResourceType.Coal,
        ResourceType.Iron,
        ResourceType.Copper,
        ResourceType.Gold,
        ResourceType.Plastic,
        ResourceType.Silicon,
        ResourceType.Steel,
        ResourceType.ElectricCircuits,
        ResourceType.AdvancedComponents,
        ResourceType.IndustrialMachines,
      ],
    },
  },
];
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

    const chainRows = CHAIN_SCENARIOS.flatMap(({ label, scenario }) => RECIPE_WINDOW_SCENARIOS.map((marketScenario) => {
      const completedResearchProjectIds = marketResearchProjectIds(marketScenario.localDepthLevel, marketScenario.diffusionLevel);
      const result = simulateRecipeEconomyChain({ ...scenario, completedResearchProjectIds });
      const primarySoldResource = scenario.sellResourceTypes[0]!;
      return {
        chain: label,
        marketScenario: marketScenario.label,
        surplusSold: scenario.sellResourceTypes.map((resourceType) => getResource(resourceType).name).join(', '),
        facilityInvestmentCost: money(result.facilityInvestmentCost),
        recipeResearchCost: money(result.recipeResearchInvestmentCost),
        constructionMaterialsDemand: money(result.constructionMaterialsDemand),
        constructionDemandFulfilled: money(result.fulfilledConstructionMaterialsDemand),
        margin180m: money(result.netMarginPerMinute),
        finalPrimaryUnitPrice: money(result.finalSoldUnitPrices[primarySoldResource] ?? 0),
        payback: minute(result.paybackMinute),
        stalledFacilityMinutes: result.stalledFacilityMinutes,
      };
    }));
    console.log('\nConnected-chain economy (180 minutes)');
    console.table(chainRows);
    reportSections.push(
      '## Connected-chain economy (180 minutes)',
      '',
      'Each row runs all listed facilities in one shared market. Upstream production is available to downstream facilities before the listed surplus outputs are sold. Payback includes facility construction and each distinct recipe-unlock research cost. Construction Materials demand consumes the total material requirement for every participating facility evenly through the scenario; it represents external building demand, not a player expense.',
      '',
      markdownTable(chainRows),
      '',
    );

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
