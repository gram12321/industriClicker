import { describe, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FACILITIES } from '@/game/facilities/facilityConstants';
import { getRecipeDisplayName, RecipeName } from '@/game/recipes';
import { getRecipeResearchProjectId, getResearchProject } from '@/game/research';
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
  { label: 'Base market', localDepthLevel: 0, diffusionLevel: 0 },
  { label: 'Network III', localDepthLevel: 3, diffusionLevel: 3 },
] as const;
const CHAIN_SCENARIOS: ReadonlyArray<{ label: string; scenario: RecipeEconomyChainScenario }> = [
  {
    label: 'Staples: utilities -> Farm',
    scenario: {
      facilities: [
        { recipeName: RecipeName.ProduceWater },
        { recipeName: RecipeName.ProduceElectricity },
        { recipeName: RecipeName.GrowGrain },
        { recipeName: RecipeName.GrowSugar },
      ],
      durationMinutes: RECIPE_ECONOMY_EXTENDED_WINDOW_MINUTES,
      primaryOutputResourceTypes: [ResourceType.Grain, ResourceType.Sugar],
      includeConstructionInputsDemand: true,
    },
  },
  {
    label: 'Extraction: utilities -> Mine',
    scenario: {
      facilities: [
        { recipeName: RecipeName.ProduceWater },
        { recipeName: RecipeName.ProduceElectricity },
        { recipeName: RecipeName.MineCoal },
        { recipeName: RecipeName.MineIron },
        { recipeName: RecipeName.MineCopper },
      ],
      durationMinutes: RECIPE_ECONOMY_EXTENDED_WINDOW_MINUTES,
      primaryOutputResourceTypes: [ResourceType.Coal, ResourceType.Iron, ResourceType.Copper],
      includeConstructionInputsDemand: true,
    },
  },
  {
    label: 'Fertilizer bridge: quarry -> Grain and Sugar',
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
      primaryOutputResourceTypes: [ResourceType.Grain, ResourceType.Sugar],
      includeConstructionInputsDemand: true,
    },
  },
  {
    label: 'Fertilizer bridge: market inputs -> Grain and Sugar',
    scenario: {
      facilities: [
        { recipeName: RecipeName.ProduceWater },
        { recipeName: RecipeName.ProduceElectricity },
        { recipeName: RecipeName.SynthesizeFertilizer },
        { recipeName: RecipeName.GrowGrain },
        { recipeName: RecipeName.GrowSugar },
      ],
      durationMinutes: RECIPE_ECONOMY_EXTENDED_WINDOW_MINUTES,
      primaryOutputResourceTypes: [ResourceType.Grain, ResourceType.Sugar],
      includeConstructionInputsDemand: true,
    },
  },
  {
    label: 'Fertilizer: quarry -> Fertilizer',
    scenario: {
      facilities: [
        { recipeName: RecipeName.ProduceWater },
        { recipeName: RecipeName.ProduceElectricity },
        { recipeName: RecipeName.QuarryMinerals },
        { recipeName: RecipeName.ProduceChemicals },
        { recipeName: RecipeName.SynthesizeFertilizer },
      ],
      durationMinutes: RECIPE_ECONOMY_EXTENDED_WINDOW_MINUTES,
      primaryOutputResourceTypes: [ResourceType.Fertilizer],
      includeConstructionInputsDemand: true,
    },
  },
  {
    label: 'Plastic: quarry -> Plastic',
    scenario: {
      facilities: [
        { recipeName: RecipeName.ProduceWater },
        { recipeName: RecipeName.ProduceElectricity },
        { recipeName: RecipeName.QuarryMinerals },
        { recipeName: RecipeName.ProduceChemicals },
        { recipeName: RecipeName.ProducePlastic },
      ],
      durationMinutes: RECIPE_ECONOMY_EXTENDED_WINDOW_MINUTES,
      primaryOutputResourceTypes: [ResourceType.Plastic],
      includeConstructionInputsDemand: true,
    },
  },
  {
    label: 'Steel: mines -> Steel',
    scenario: {
      facilities: [
        { recipeName: RecipeName.ProduceWater },
        { recipeName: RecipeName.ProduceElectricity },
        { recipeName: RecipeName.MineCoal },
        { recipeName: RecipeName.MineIron },
        { recipeName: RecipeName.ProduceSteel },
      ],
      durationMinutes: RECIPE_ECONOMY_EXTENDED_WINDOW_MINUTES,
      primaryOutputResourceTypes: [ResourceType.Steel],
      includeConstructionInputsDemand: true,
    },
  },
  {
    label: 'Poultry -> Cake',
    scenario: {
      facilities: [
        { recipeName: RecipeName.ProduceWater },
        { recipeName: RecipeName.ProduceElectricity },
        { recipeName: RecipeName.QuarryMinerals },
        { recipeName: RecipeName.ProduceChemicals },
        { recipeName: RecipeName.SynthesizeFertilizer },
        { recipeName: RecipeName.GrowGrain },
        { recipeName: RecipeName.RaiseChicken },
        { recipeName: RecipeName.BakeCake },
      ],
      durationMinutes: RECIPE_ECONOMY_EXTENDED_WINDOW_MINUTES,
      primaryOutputResourceTypes: [ResourceType.Cake],
      includeConstructionInputsDemand: true,
    },
  },
  {
    label: 'Cattle -> Meat Pie',
    scenario: {
      facilities: [
        { recipeName: RecipeName.ProduceWater },
        { recipeName: RecipeName.ProduceElectricity },
        { recipeName: RecipeName.QuarryMinerals },
        { recipeName: RecipeName.ProduceChemicals },
        { recipeName: RecipeName.SynthesizeFertilizer },
        { recipeName: RecipeName.GrowGrain },
        { recipeName: RecipeName.RaiseCattle },
        { recipeName: RecipeName.BakeMeatPie },
      ],
      durationMinutes: RECIPE_ECONOMY_EXTENDED_WINDOW_MINUTES,
      primaryOutputResourceTypes: [ResourceType.MeatPie],
      includeConstructionInputsDemand: true,
    },
  },
  {
    label: 'Animal farm and bakery: inputs -> Cake, Premium Cake, and Meat Pie',
    scenario: {
      facilities: [
        { recipeName: RecipeName.ProduceWater },
        { recipeName: RecipeName.ProduceElectricity },
        { recipeName: RecipeName.QuarryMinerals },
        { recipeName: RecipeName.ProduceChemicals },
        { recipeName: RecipeName.SynthesizeFertilizer },
        { recipeName: RecipeName.GrowGrain },
        { recipeName: RecipeName.GrowFruit },
        { recipeName: RecipeName.RaiseCattle },
        { recipeName: RecipeName.RaiseSheep },
        { recipeName: RecipeName.RaiseChicken },
        { recipeName: RecipeName.BakeCake },
        { recipeName: RecipeName.BakePremiumCake },
        { recipeName: RecipeName.BakeMeatPie },
      ],
      durationMinutes: RECIPE_ECONOMY_EXTENDED_WINDOW_MINUTES,
      primaryOutputResourceTypes: [ResourceType.Cake, ResourceType.PremiumCake, ResourceType.MeatPie],
      includeConstructionInputsDemand: true,
    },
  },
  {
    label: 'Construction: inputs -> Construction Materials',
    scenario: {
      facilities: [
        { recipeName: RecipeName.ElectricPumping },
        { recipeName: RecipeName.CoalPower },
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
      primaryOutputResourceTypes: [ResourceType.ConstructionMaterials],
      includeConstructionInputsDemand: true,
    },
  },
  {
    label: 'Industrial Machines: inputs -> Industrial Machines',
    scenario: {
      facilities: [
        { recipeName: RecipeName.ElectricPumping },
        { recipeName: RecipeName.CoalPower },
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
      primaryOutputResourceTypes: [ResourceType.IndustrialMachines],
      includeConstructionInputsDemand: true,
    },
  },
  {
    label: 'Construction Materials: market inputs -> Construction Materials',
    scenario: {
      facilities: [
        { recipeName: RecipeName.ElectricPumping },
        { recipeName: RecipeName.CoalPower },
        { recipeName: RecipeName.ProduceConstructionMaterials },
      ],
      durationMinutes: RECIPE_ECONOMY_EXTENDED_WINDOW_MINUTES,
      primaryOutputResourceTypes: [ResourceType.ConstructionMaterials],
      includeConstructionInputsDemand: true,
    },
  },
  {
    label: 'Industrial Machines: market inputs -> Industrial Machines',
    scenario: {
      facilities: [
        { recipeName: RecipeName.ElectricPumping },
        { recipeName: RecipeName.CoalPower },
        { recipeName: RecipeName.AssembleIndustrialMachines },
      ],
      durationMinutes: RECIPE_ECONOMY_EXTENDED_WINDOW_MINUTES,
      primaryOutputResourceTypes: [ResourceType.IndustrialMachines],
      includeConstructionInputsDemand: true,
    },
  },
];
function money(value: number): string {
  return value.toFixed(2);
}

function minute(value: number | null): string {
  return value === null ? 'not reached' : String(value);
}

function marketResearchProjectIds(localDepthLevel: number, diffusionLevel: number): string[] {
  return [
    ...Array.from({ length: localDepthLevel }, (_, index) => `local-market-network-${index + 1}`),
    ...Array.from({ length: diffusionLevel }, (_, index) => `market-diffusion-network-${index + 1}`),
  ];
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

function chainFacilitiesSummary(chainFacilities: RecipeEconomyChainScenario['facilities']): string {
  const counts = new Map<string, number>();
  for (const chainFacility of chainFacilities) {
    const facility = Object.values(FACILITIES).find((definition) => definition.recipes.some((recipe) => recipe.name === chainFacility.recipeName));
    if (!facility) throw new Error(`No facility found for chain recipe ${chainFacility.recipeName}.`);
    counts.set(facility.name, (counts.get(facility.name) ?? 0) + Math.max(0, Math.floor(chainFacility.count ?? 1)));
  }
  return [...counts].map(([name, count]) => `${name} x${count}`).join(', ');
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
      'Each recipe is assessed in a base market and a Network III market with Local Market Network III and Market Diffusion Network III already owned. The Network III scenario measures recipe resilience; its research is pre-owned and is not charged to facility payback. The 15/60/180-minute margins are cumulative averages; window till unprofitable is the first completed output cycle with a non-positive margin, so a later recovery remains possible.',
      '',
    ];
    const entries = recipeEntries();
    const recipeRows = grouped(entries, (entry) => {
      const recipeName = entry.recipeName;
      const scenarioResults = RECIPE_WINDOW_SCENARIOS.map((scenario) => {
        const completedResearchProjectIds = marketResearchProjectIds(scenario.localDepthLevel, scenario.diffusionLevel);
        return {
          scenario,
          initial: simulateRecipeEconomy({ recipeName, durationMinutes: 1, completedResearchProjectIds }),
          shortRun: simulateRecipeEconomy({ recipeName, durationMinutes: RECIPE_ECONOMY_SHORT_WINDOW_MINUTES, completedResearchProjectIds }),
          longRun: simulateRecipeEconomy({ recipeName, durationMinutes: RECIPE_ECONOMY_LONG_WINDOW_MINUTES, completedResearchProjectIds }),
          extendedRun: simulateRecipeEconomy({ recipeName, durationMinutes: RECIPE_ECONOMY_EXTENDED_WINDOW_MINUTES, completedResearchProjectIds }),
          horizon: simulateRecipeEconomy({ recipeName, durationMinutes: RECIPE_ECONOMY_BREAK_EVEN_HORIZON_MINUTES, completedResearchProjectIds }),
        };
      });
      return scenarioResults.map(({ scenario, initial, shortRun, longRun, extendedRun, horizon }) => ({
        recipe: entry.recipe,
        scenario: scenario.label,
        'Facility/recipe cost (EUR)': `${money(initial.facilityInvestmentCost)}/${money(getResearchProject(getRecipeResearchProjectId(recipeName))?.cost ?? 0)}`,
        'initial margin': money(initial.initialNetMarginPerMinute),
        'margin 15m/60m/180m': `${money(shortRun.netMarginPerMinute)}/${money(longRun.netMarginPerMinute)}/${money(extendedRun.netMarginPerMinute)}`,
        'output price drop at 180m EUR/percent': `${money(initial.initialOutputUnitPrice - extendedRun.finalOutputUnitPrice)}/${initial.initialOutputUnitPrice > 0
          ? `${(((initial.initialOutputUnitPrice - extendedRun.finalOutputUnitPrice) / initial.initialOutputUnitPrice) * 100).toFixed(1)}%`
          : '0.0%'}`,
        'maintenance 60m': money(longRun.totalMaintenanceCost),
        'window till unprofitable': minute(horizon.breakEvenMinute),
        'facility payback': minute(horizon.paybackMinute),
      }));
    });
    console.log('\nRecipe economy: one fully staffed facility, local input purchases, local output sales, 70% repair threshold');
    for (const [facility, rows] of recipeRows) {
      const flatRows = rows.flat();
      console.log(`\n${facility}`);
      console.table(flatRows);
      reportSections.push(`## ${facility}`, '', 'Network III applies pre-owned Local Market Network III and Market Diffusion Network III. It is a market-resilience scenario: neither network research nor recipe-unlock research is charged to facility payback.', '', markdownTable(flatRows), '');
    }

    const chainRows = CHAIN_SCENARIOS.map(({ label, scenario }) => {
      const shortRun = simulateRecipeEconomyChain({ ...scenario, durationMinutes: RECIPE_ECONOMY_SHORT_WINDOW_MINUTES });
      const longRun = simulateRecipeEconomyChain({ ...scenario, durationMinutes: RECIPE_ECONOMY_LONG_WINDOW_MINUTES });
      const extendedRun = simulateRecipeEconomyChain(scenario);
      const horizon = simulateRecipeEconomyChain({ ...scenario, durationMinutes: RECIPE_ECONOMY_BREAK_EVEN_HORIZON_MINUTES });
      const stalledFacilityMinutes = shortRun.stalledFacilityMinutes + longRun.stalledFacilityMinutes + extendedRun.stalledFacilityMinutes + horizon.stalledFacilityMinutes;
      if (stalledFacilityMinutes > 0) throw new Error(`Connected-chain scenario "${label}" stalled for ${stalledFacilityMinutes} facility-minutes.`);
      return {
        chain: label,
        'primary output': scenario.primaryOutputResourceTypes.map((resourceType) => getResource(resourceType).name).join(', '),
        facilities: chainFacilitiesSummary(scenario.facilities),
        'setup cost (EUR)': money(extendedRun.facilityInvestmentCost + extendedRun.recipeResearchInvestmentCost),
        'market input cost (EUR)': money(extendedRun.totalInputCost),
        'margin 15m/60m/180m': `${money(shortRun.netMarginPerMinute)}/${money(longRun.netMarginPerMinute)}/${money(extendedRun.netMarginPerMinute)}`,
        'window till unprofitable': minute(horizon.breakEvenMinute),
        'facility payback': minute(horizon.paybackMinute),
      };
    });
    console.log('\nConnected-chain economy (180 minutes)');
    console.table(chainRows);
    reportSections.push(
      '## Connected-chain economy (180 minutes)',
      '',
      'Each row runs all listed facilities in one shared base market. Upstream production is available to downstream facilities before each minute ends; the chain retains the following minute\'s required inputs and sells every other produced good. The 15/60/180-minute margins are cumulative averages; window till unprofitable is the first output minute with a non-positive margin, so a later recovery remains possible. Setup cost includes land, Construction Materials, Industrial Machines, and each distinct recipe-unlock research cost. Construction demand consumes the participating facilities\' total Construction Materials and Industrial Machines requirement evenly through the 180-minute scenario; it is external demand, not a player expense. A scenario that stalls a facility is treated as an invalid report scenario.',
      '',
      markdownTable(chainRows),
      '',
    );

    const reportPath = process.env.RECIPE_ECONOMY_REPORT_PATH;
    if (reportPath) {
      writeFileSync(reportPath, `${reportSections.join('\n')}\n`, 'utf8');
      console.log(`\nMarkdown report written to ${reportPath}`);
    }
  }, 30_000);
});
