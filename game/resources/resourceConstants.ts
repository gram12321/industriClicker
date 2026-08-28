import { ResourceType, type ResourceMarketDefinition } from './resourceTypes';
import { RESOURCE_ICONS } from '@/icons';

/**
 * Deferred material and consumer-industry roadmap. These are design notes only;
 * they are intentionally not part of the active resource or facility catalogue.
 *
 * - Material refining: Hides + Chemicals + Water → Leather; Wool + Water +
 *   Electricity + Chemicals → Wool Fabric.
 * - Silk: a future Plantation can consume Sugar and produce Raw Silk, followed
 *   by Silk Refining into Luxury Fabric with supporting inputs.
 * - Textiles: a future Textile Mill or Clothing Factory can produce Basic
 *   Clothing and Luxury Clothing, creating additional uses for Plastic and Gold
 *   (for example, jewellery or trim in luxury garments).
 * - Automotive industry: future vehicle recipes may consume Leather and Rubber.

  'Material refining: Hides to Leather and Wool to Wool Fabric.',
  'Plantation and silk chain: Sugar to Raw Silk to Luxury Fabric.',
  'Textile/clothing industry: Basic Clothing and Luxury Clothing, with Plastic and Gold inputs.',
  'Automotive industry: future vehicle products using Leather and Rubber.',

* REMEMBER TO REARRANGE THE RESOURCE_GROUPS: WE WANT A CONSUMER GOODS, AND WE WANT TO MOVE STEEL TO CONSTRUCTION. ETC.

 */
export const RESOURCE_TYPES = [
  ResourceType.Grain,
  ResourceType.Bread,
  ResourceType.Water,
  ResourceType.Electricity,
  ResourceType.Sugar,
  ResourceType.Coal,
  ResourceType.Iron,
  ResourceType.Copper,
  ResourceType.Steel,
  ResourceType.ElectricCircuits,
  ResourceType.Bricks,
  ResourceType.Cement,
  ResourceType.ReinforcedConcrete,
  ResourceType.ConstructionMaterials,
  ResourceType.Sand,
  ResourceType.Clay,
  ResourceType.Stone,
  ResourceType.Minerals,
  ResourceType.Chemicals,
  ResourceType.Fertilizer,
  ResourceType.Plastic,
  ResourceType.Silicon,
  ResourceType.Gold,
  ResourceType.AdvancedComponents,
  ResourceType.IndustrialMachines,
  ResourceType.Cake,
  ResourceType.Eggs,
  ResourceType.Fruit,
  ResourceType.Meat,
  ResourceType.MeatPie,
  ResourceType.Milk,
  ResourceType.Timber,
  ResourceType.Planks,
  ResourceType.Leather,
  ResourceType.Furniture,
  ResourceType.Wool,
  ResourceType.HouseholdCleaningProducts,
  ResourceType.PaintHomeCoatings,
  ResourceType.GardenSupplies,
  ResourceType.DisplayPanels,
  ResourceType.PersonalElectronics,
  ResourceType.HouseholdAppliances,
] as const;

export type ResourceGroup = 'food' | 'raw-resources' | 'construction' | 'intermediates' | 'manufacturing' | 'utilities';

/** Player-facing resource groupings shared by Pedia and other catalogues; each group is alphabetized by display name. */
export const RESOURCE_GROUPS: ReadonlyArray<{ id: ResourceGroup; label: string; resources: readonly ResourceType[] }> = [
  {
    id: 'food',
    label: 'Food',
    resources: [
      ResourceType.Bread,
      ResourceType.Cake,
      ResourceType.Eggs,
      ResourceType.Fruit,
      ResourceType.Grain,
      ResourceType.Meat,
      ResourceType.MeatPie,
      ResourceType.Milk,
      ResourceType.Sugar,
    ],
  },
  {
    id: 'raw-resources',
    label: 'Raw Resources',
    resources: [
      ResourceType.Clay,
      ResourceType.Coal,
      ResourceType.Copper,
      ResourceType.Gold,
      ResourceType.Iron,
      ResourceType.Leather,
      ResourceType.Minerals,
      ResourceType.Sand,
      ResourceType.Stone,
      ResourceType.Timber,
      ResourceType.Wool,
    ],
  },
  {
    id: 'construction',
    label: 'Construction',
    resources: [
      ResourceType.Bricks,
      ResourceType.Cement,
      ResourceType.ConstructionMaterials,
      ResourceType.Planks,
      ResourceType.ReinforcedConcrete,
      ResourceType.Steel,
    ],
  },
  {
    id: 'intermediates',
    label: 'Intermediates',
    resources: [
      ResourceType.AdvancedComponents,
      ResourceType.Chemicals,
      ResourceType.DisplayPanels,
      ResourceType.ElectricCircuits,
      ResourceType.Plastic,
      ResourceType.Silicon,
    ],
  },
  {
    id: 'manufacturing',
    label: 'Manufacturing',
    resources: [
      ResourceType.Fertilizer,
      ResourceType.Furniture,
      ResourceType.GardenSupplies,
      ResourceType.HouseholdAppliances,
      ResourceType.HouseholdCleaningProducts,
      ResourceType.IndustrialMachines,
      ResourceType.PaintHomeCoatings,
      ResourceType.PersonalElectronics,
    ],
  },
  {
    id: 'utilities',
    label: 'Utilities',
    resources: [
    ResourceType.Electricity, 
    ResourceType.Water],
  },
];

/** Code-owned resource catalogue. It is never stored in a player save. */
export const RESOURCES: Readonly<Record<ResourceType, { name: string; market: ResourceMarketDefinition }>> = {
  // Food (alphabetized)
  [ResourceType.Bread]: {
    name: 'Bread',
    market: {
      localBenchmarkSupply: 6_000,
      localInitialSupply: 2_500,
      regionalBenchmarkSupply: 120_000,
      regionalInitialSupply: 50_000,
      globalBenchmarkSupply: 1_200_000,
      globalInitialSupply: 500_000,
      logisticsMultiplier: 0.5,
      valueDensityMultiplier: 1.1,
    },
  },
  [ResourceType.Cake]: {
    name: 'Cake',
    market: {
      localBenchmarkSupply: 1_750,
      localInitialSupply: 250,
      regionalBenchmarkSupply: 35_000,
      regionalInitialSupply: 5_000,
      globalBenchmarkSupply: 350_000,
      globalInitialSupply: 50_000,
      logisticsMultiplier: 0.4,
      valueDensityMultiplier: 1.15,
    },
  },
  [ResourceType.Eggs]: {
    name: 'Eggs',
    market: {
      localBenchmarkSupply: 1_000,
      localInitialSupply: 250,
      regionalBenchmarkSupply: 20_000,
      regionalInitialSupply: 5_000,
      globalBenchmarkSupply: 200_000,
      globalInitialSupply: 50_000,
      logisticsMultiplier: 0.6,
      valueDensityMultiplier: 1,
    },
  },
  [ResourceType.Fruit]: {
    name: 'Fruit',
    market: {
      localBenchmarkSupply: 900,
      localInitialSupply: 1_000,
      regionalBenchmarkSupply: 90_000,
      regionalInitialSupply: 100_000,
      globalBenchmarkSupply: 900_000,
      globalInitialSupply: 1_000_000,
      logisticsMultiplier: 0.65,
      valueDensityMultiplier: 0.9,
    },
  },
  [ResourceType.Grain]: {
    name: 'Grain',
    market: {
      localBenchmarkSupply: 800,
      localInitialSupply: 1_000,
      regionalBenchmarkSupply: 80_000,
      regionalInitialSupply: 100_000,
      globalBenchmarkSupply: 800_000,
      globalInitialSupply: 1_000_000,
      logisticsMultiplier: 1,
      valueDensityMultiplier: 0.9,
    },
  },
  [ResourceType.Meat]: {
    name: 'Meat',
    market: {
      localBenchmarkSupply: 1_200,
      localInitialSupply: 120,
      regionalBenchmarkSupply: 24_000,
      regionalInitialSupply: 2_400,
      globalBenchmarkSupply: 240_000,
      globalInitialSupply: 24_000,
      logisticsMultiplier: 0.55,
      valueDensityMultiplier: 1.2,
    },
  },
  [ResourceType.MeatPie]: {
    name: 'Meat Pie',
    market: {
      localBenchmarkSupply: 1_600,
      localInitialSupply: 200,
      regionalBenchmarkSupply: 32_000,
      regionalInitialSupply: 4_000,
      globalBenchmarkSupply: 320_000,
      globalInitialSupply: 40_000,
      logisticsMultiplier: 0.5,
      valueDensityMultiplier: 1.15,
    },
  },
  [ResourceType.Milk]: {
    name: 'Milk',
    market: {
      localBenchmarkSupply: 800,
      localInitialSupply: 200,
      regionalBenchmarkSupply: 16_000,
      regionalInitialSupply: 4_000,
      globalBenchmarkSupply: 160_000,
      globalInitialSupply: 40_000,
      logisticsMultiplier: 0.5,
      valueDensityMultiplier: 0.9,
    },
  },
  [ResourceType.Sugar]: {
    name: 'Sugar',
    market: {
      localBenchmarkSupply: 700,
      localInitialSupply: 1_000,
      regionalBenchmarkSupply: 70_000,
      regionalInitialSupply: 100_000,
      globalBenchmarkSupply: 700_000,
      globalInitialSupply: 1_000_000,
      logisticsMultiplier: 1,
      valueDensityMultiplier: 0.95,
    },
  },

  // Raw Resources (alphabetized)
  [ResourceType.Clay]: {
    name: 'Clay',
    market: {
      localBenchmarkSupply: 1_600,
      localInitialSupply: 2_000,
      regionalBenchmarkSupply: 160_000,
      regionalInitialSupply: 200_000,
      globalBenchmarkSupply: 1_600_000,
      globalInitialSupply: 2_000_000,
      logisticsMultiplier: 0.5,
      valueDensityMultiplier: 0.75,
    },
  },
  [ResourceType.Coal]: {
    name: 'Coal',
    market: {
      localBenchmarkSupply: 900,
      localInitialSupply: 500,
      regionalBenchmarkSupply: 18_000,
      regionalInitialSupply: 10_000,
      globalBenchmarkSupply: 180_000,
      globalInitialSupply: 100_000,
      logisticsMultiplier: 0.8,
      valueDensityMultiplier: 0.9,
    },
  },
  [ResourceType.Copper]: {
    name: 'Copper',
    market: {
      localBenchmarkSupply: 1_250,
      localInitialSupply: 250,
      regionalBenchmarkSupply: 25_000,
      regionalInitialSupply: 5_000,
      globalBenchmarkSupply: 250_000,
      globalInitialSupply: 50_000,
      logisticsMultiplier: 1,
      valueDensityMultiplier: 1.15,
    },
  },
  [ResourceType.Gold]: {
    name: 'Gold',
    market: {
      localBenchmarkSupply: 1_600,
      localInitialSupply: 20,
      regionalBenchmarkSupply: 16_000,
      regionalInitialSupply: 200,
      globalBenchmarkSupply: 160_000,
      globalInitialSupply: 2_000,
      logisticsMultiplier: 1,
      valueDensityMultiplier: 1.8,
    },
  },
  [ResourceType.Iron]: {
    name: 'Iron',
    market: {
      localBenchmarkSupply: 1_125,
      localInitialSupply: 250,
      regionalBenchmarkSupply: 22_500,
      regionalInitialSupply: 5_000,
      globalBenchmarkSupply: 225_000,
      globalInitialSupply: 50_000,
      logisticsMultiplier: 0.8,
      valueDensityMultiplier: 1.1,
    },
  },
  [ResourceType.Minerals]: {
    name: 'Minerals',
    market: {
      localBenchmarkSupply: 1_000,
      localInitialSupply: 1_000,
      regionalBenchmarkSupply: 100_000,
      regionalInitialSupply: 100_000,
      globalBenchmarkSupply: 1_000_000,
      globalInitialSupply: 1_000_000,
      logisticsMultiplier: 0.55,
      valueDensityMultiplier: 0.8,
    },
  },
  [ResourceType.Sand]: {
    name: 'Sand',
    market: {
      localBenchmarkSupply: 800,
      localInitialSupply: 2_000,
      regionalBenchmarkSupply: 80_000,
      regionalInitialSupply: 200_000,
      globalBenchmarkSupply: 800_000,
      globalInitialSupply: 2_000_000,
      logisticsMultiplier: 0.35,
      valueDensityMultiplier: 0.7,
    },
  },
  [ResourceType.Stone]: {
    name: 'Stone',
    market: {
      localBenchmarkSupply: 1_000,
      localInitialSupply: 500,
      regionalBenchmarkSupply: 100_000,
      regionalInitialSupply: 50_000,
      globalBenchmarkSupply: 1_000_000,
      globalInitialSupply: 500_000,
      logisticsMultiplier: 0.35,
      valueDensityMultiplier: 0.7,
    },
  },

  // Construction (alphabetized)
  [ResourceType.Bricks]: {
    name: 'Bricks',
    market: {
      localBenchmarkSupply: 450,
      localInitialSupply: 300,
      regionalBenchmarkSupply: 45_000,
      regionalInitialSupply: 30_000,
      globalBenchmarkSupply: 450_000,
      globalInitialSupply: 300_000,
      logisticsMultiplier: 0.4,
      valueDensityMultiplier: 0.8,
    },
  },
  [ResourceType.Cement]: {
    name: 'Cement',
    market: {
      localBenchmarkSupply: 2_250,
      localInitialSupply: 500,
      regionalBenchmarkSupply: 45_000,
      regionalInitialSupply: 10_000,
      globalBenchmarkSupply: 450_000,
      globalInitialSupply: 100_000,
      logisticsMultiplier: 0.45,
      valueDensityMultiplier: 0.9,
    },
  },
  [ResourceType.ConstructionMaterials]: {
    name: 'Construction Materials',
    market: {
      localBenchmarkSupply: 2_550,
      localInitialSupply: 300,
      regionalBenchmarkSupply: 8_500,
      regionalInitialSupply: 1_000,
      globalBenchmarkSupply: 85_000,
      globalInitialSupply: 5_000,
      logisticsMultiplier: 0.5,
      valueDensityMultiplier: 1.2,
    },
  },
  [ResourceType.ReinforcedConcrete]: {
    name: 'Reinforced Concrete',
    market: {
      localBenchmarkSupply: 4_400,
      localInitialSupply: 200,
      regionalBenchmarkSupply: 44_000,
      regionalInitialSupply: 2_000,
      globalBenchmarkSupply: 440_000,
      globalInitialSupply: 20_000,
      logisticsMultiplier: 0.4,
      valueDensityMultiplier: 1.15,
    },
  },

  // Manufacturing (alphabetized)
  [ResourceType.AdvancedComponents]: {
    name: 'Advanced Components',
    market: {
      localBenchmarkSupply: 10_000,
      localInitialSupply: 100,
      regionalBenchmarkSupply: 200_000,
      regionalInitialSupply: 2_000,
      globalBenchmarkSupply: 2_000_000,
      globalInitialSupply: 20_000,
      logisticsMultiplier: 1.1,
      valueDensityMultiplier: 1.6,
    },
  },
  [ResourceType.Chemicals]: {
    name: 'Chemicals',
    market: {
      localBenchmarkSupply: 2_500,
      localInitialSupply: 250,
      regionalBenchmarkSupply: 50_000,
      regionalInitialSupply: 5_000,
      globalBenchmarkSupply: 500_000,
      globalInitialSupply: 50_000,
      logisticsMultiplier: 0.6,
      valueDensityMultiplier: 1,
    },
  },
  [ResourceType.ElectricCircuits]: {
    name: 'Electric Circuits',
    market: {
      localBenchmarkSupply: 12_500,
      localInitialSupply: 500,
      regionalBenchmarkSupply: 250_000,
      regionalInitialSupply: 10_000,
      globalBenchmarkSupply: 2_500_000,
      globalInitialSupply: 100_000,
      logisticsMultiplier: 1.25,
      valueDensityMultiplier: 1.35,
    },
  },
  [ResourceType.Fertilizer]: {
    name: 'Fertilizer',
    market: {
      localBenchmarkSupply: 3_000,
      localInitialSupply: 300,
      regionalBenchmarkSupply: 40_000,
      regionalInitialSupply: 4_000,
      globalBenchmarkSupply: 400_000,
      globalInitialSupply: 40_000,
      logisticsMultiplier: 0.65,
      valueDensityMultiplier: 0.9,
    },
  },
  [ResourceType.IndustrialMachines]: {
    name: 'Industrial Machines',
    market: {
      localBenchmarkSupply: 15_000,
      localInitialSupply: 100,
      regionalBenchmarkSupply: 300_000,
      regionalInitialSupply: 2_000,
      globalBenchmarkSupply: 3_000_000,
      globalInitialSupply: 20_000,
      logisticsMultiplier: 0.8,
      valueDensityMultiplier: 1.5,
    },
  },
  [ResourceType.Plastic]: {
    name: 'Plastic',
    market: {
      localBenchmarkSupply: 4_500,
      localInitialSupply: 300,
      regionalBenchmarkSupply: 60_000,
      regionalInitialSupply: 4_000,
      globalBenchmarkSupply: 600_000,
      globalInitialSupply: 40_000,
      logisticsMultiplier: 0.75,
      valueDensityMultiplier: 1,
    },
  },
  [ResourceType.Silicon]: {
    name: 'Silicon',
    market: {
      localBenchmarkSupply: 3_600,
      localInitialSupply: 150,
      regionalBenchmarkSupply: 36_000,
      regionalInitialSupply: 1_500,
      globalBenchmarkSupply: 360_000,
      globalInitialSupply: 15_000,
      logisticsMultiplier: 0.9,
      valueDensityMultiplier: 1.25,
    },
  },
  [ResourceType.Steel]: {
    name: 'Steel',
    market: {
      localBenchmarkSupply: 2_800,
      localInitialSupply: 400,
      regionalBenchmarkSupply: 28_000,
      regionalInitialSupply: 4_000,
      globalBenchmarkSupply: 280_000,
      globalInitialSupply: 40_000,
      logisticsMultiplier: 0.75,
      valueDensityMultiplier: 1.1,
    },
  },
  [ResourceType.Timber]: {
    name: 'Timber',
    market: { localBenchmarkSupply: 900, localInitialSupply: 500, regionalBenchmarkSupply: 18_000, regionalInitialSupply: 10_000, globalBenchmarkSupply: 180_000, globalInitialSupply: 100_000, logisticsMultiplier: 0.5, valueDensityMultiplier: 0.85 },
  },
  [ResourceType.Planks]: {
    name: 'Planks',
    market: { localBenchmarkSupply: 1_200, localInitialSupply: 300, regionalBenchmarkSupply: 24_000, regionalInitialSupply: 6_000, globalBenchmarkSupply: 240_000, globalInitialSupply: 60_000, logisticsMultiplier: 0.45, valueDensityMultiplier: 0.9 },
  },
  [ResourceType.Leather]: {
    name: 'Leather',
    market: { localBenchmarkSupply: 2_400, localInitialSupply: 120, regionalBenchmarkSupply: 48_000, regionalInitialSupply: 2_400, globalBenchmarkSupply: 480_000, globalInitialSupply: 24_000, logisticsMultiplier: 0.7, valueDensityMultiplier: 1.25 },
  },
  [ResourceType.Furniture]: {
    name: 'Furniture',
    market: { localBenchmarkSupply: 6_000, localInitialSupply: 100, regionalBenchmarkSupply: 120_000, regionalInitialSupply: 2_000, globalBenchmarkSupply: 1_200_000, globalInitialSupply: 20_000, logisticsMultiplier: 0.35, valueDensityMultiplier: 1.35 },
  },
  [ResourceType.Wool]: {
    name: 'Wool',
    market: {
      localBenchmarkSupply: 1_800,
      localInitialSupply: 150,
      regionalBenchmarkSupply: 36_000,
      regionalInitialSupply: 3_000,
      globalBenchmarkSupply: 360_000,
      globalInitialSupply: 30_000,
      logisticsMultiplier: 0.7,
      valueDensityMultiplier: 1.1,
    },
  },
  [ResourceType.DisplayPanels]: {
    name: 'Display Panels',
    market: { localBenchmarkSupply: 600, localInitialSupply: 20, regionalBenchmarkSupply: 12_000, regionalInitialSupply: 400, globalBenchmarkSupply: 120_000, globalInitialSupply: 4_000, logisticsMultiplier: 1.15, valueDensityMultiplier: 1.45 },
  },
  [ResourceType.GardenSupplies]: {
    name: 'Garden Supplies',
    market: { localBenchmarkSupply: 900, localInitialSupply: 40, regionalBenchmarkSupply: 18_000, regionalInitialSupply: 800, globalBenchmarkSupply: 180_000, globalInitialSupply: 8_000, logisticsMultiplier: 0.6, valueDensityMultiplier: 1.1 },
  },
  [ResourceType.HouseholdAppliances]: {
    name: 'Household Appliances',
    market: { localBenchmarkSupply: 700, localInitialSupply: 30, regionalBenchmarkSupply: 14_000, regionalInitialSupply: 600, globalBenchmarkSupply: 140_000, globalInitialSupply: 6_000, logisticsMultiplier: 0.55, valueDensityMultiplier: 1.35 },
  },
  [ResourceType.HouseholdCleaningProducts]: {
    name: 'Household Cleaning Products',
    market: { localBenchmarkSupply: 1_200, localInitialSupply: 80, regionalBenchmarkSupply: 24_000, regionalInitialSupply: 1_600, globalBenchmarkSupply: 240_000, globalInitialSupply: 16_000, logisticsMultiplier: 0.5, valueDensityMultiplier: 1.05 },
  },
  [ResourceType.PaintHomeCoatings]: {
    name: 'Paint & Home Coatings',
    market: { localBenchmarkSupply: 1_000, localInitialSupply: 50, regionalBenchmarkSupply: 20_000, regionalInitialSupply: 1_000, globalBenchmarkSupply: 200_000, globalInitialSupply: 10_000, logisticsMultiplier: 0.55, valueDensityMultiplier: 1.15 },
  },
  [ResourceType.PersonalElectronics]: {
    name: 'Personal Electronics',
    market: { localBenchmarkSupply: 800, localInitialSupply: 25, regionalBenchmarkSupply: 16_000, regionalInitialSupply: 500, globalBenchmarkSupply: 160_000, globalInitialSupply: 5_000, logisticsMultiplier: 0.7, valueDensityMultiplier: 1.5 },
  },

  // Utilities (alphabetized)
  [ResourceType.Electricity]: {
    name: 'Electricity',
    market: {
      localBenchmarkSupply: 400,
      localInitialSupply: 1_000,
      regionalBenchmarkSupply: 40_000,
      regionalInitialSupply: 100_000,
      globalBenchmarkSupply: 400_000,
      globalInitialSupply: 1_000_000,
      logisticsMultiplier: 1.5,
      valueDensityMultiplier: 1,
    },
  },
  [ResourceType.Water]: {
    name: 'Water',
    market: {
      localBenchmarkSupply: 200,
      localInitialSupply: 2_000,
      regionalBenchmarkSupply: 20_000,
      regionalInitialSupply: 200_000,
      globalBenchmarkSupply: 200_000,
      globalInitialSupply: 2_000_000,
      logisticsMultiplier: 0.6,
      valueDensityMultiplier: 0.7,
    },
  },
};



export function getResource(resourceType: ResourceType) {
  return { ...RESOURCES[resourceType], icon: RESOURCE_ICONS[resourceType] };
}

export function getResourceIcon(resourceType: ResourceType): string {
  return RESOURCE_ICONS[resourceType];
}
