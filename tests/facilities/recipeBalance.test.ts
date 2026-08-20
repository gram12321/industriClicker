import { describe, expect, it } from 'vitest';
import { getRecipe, RecipeName } from '@/game/recipes';
import { Facility } from '@/game/facilities/facility';
import { calculateFacilityEffectiveWork } from '@/game/facilities/facilityProduction';
import { FacilityType } from '@/game/facilities/facilityTypes';

type RecipeTimingCase = {
  facilityType: FacilityType;
  recipeName: RecipeName;
  expectedSeconds: number;
};

const RECIPE_TIMING_CASES: readonly RecipeTimingCase[] = [
  { facilityType: FacilityType.Farm, recipeName: RecipeName.GrowGrain, expectedSeconds: 3 },
  { facilityType: FacilityType.Farm, recipeName: RecipeName.GrowSugar, expectedSeconds: 6 },
  { facilityType: FacilityType.Farm, recipeName: RecipeName.GrowFruit, expectedSeconds: 8 },
  { facilityType: FacilityType.AnimalFarm, recipeName: RecipeName.RaiseCattle, expectedSeconds: 26.25 },
  { facilityType: FacilityType.AnimalFarm, recipeName: RecipeName.RaiseSheep, expectedSeconds: 18.75 },
  { facilityType: FacilityType.AnimalFarm, recipeName: RecipeName.RaiseChicken, expectedSeconds: 15 },
  { facilityType: FacilityType.Bakery, recipeName: RecipeName.BakeBread, expectedSeconds: 12 },
  { facilityType: FacilityType.Bakery, recipeName: RecipeName.BakeCake, expectedSeconds: 18 },
  { facilityType: FacilityType.Bakery, recipeName: RecipeName.BakePremiumCake, expectedSeconds: 24 },
  { facilityType: FacilityType.Bakery, recipeName: RecipeName.BakeMeatPie, expectedSeconds: 30 },
  { facilityType: FacilityType.SmallUtilityWorks, recipeName: RecipeName.ProduceWater, expectedSeconds: 4 },
  { facilityType: FacilityType.SmallUtilityWorks, recipeName: RecipeName.ProduceElectricity, expectedSeconds: 6 },
  { facilityType: FacilityType.Mine, recipeName: RecipeName.MineCoal, expectedSeconds: 6 },
  { facilityType: FacilityType.Mine, recipeName: RecipeName.MineIron, expectedSeconds: 8 },
  { facilityType: FacilityType.Mine, recipeName: RecipeName.MineCopper, expectedSeconds: 10 },
  { facilityType: FacilityType.Mine, recipeName: RecipeName.MineGold, expectedSeconds: 20 },
  { facilityType: FacilityType.Quarry, recipeName: RecipeName.QuarrySand, expectedSeconds: 4 },
  { facilityType: FacilityType.Quarry, recipeName: RecipeName.QuarryClay, expectedSeconds: 6 },
  { facilityType: FacilityType.Quarry, recipeName: RecipeName.QuarryStone, expectedSeconds: 8 },
  { facilityType: FacilityType.Quarry, recipeName: RecipeName.QuarryMinerals, expectedSeconds: 6 },
  { facilityType: FacilityType.IndustrialProcessingFactory, recipeName: RecipeName.ProduceSteel, expectedSeconds: 30 },
  { facilityType: FacilityType.IndustrialProcessingFactory, recipeName: RecipeName.ProduceElectricCircuits, expectedSeconds: 45 },
  { facilityType: FacilityType.ChemicalPlant, recipeName: RecipeName.ProduceChemicals, expectedSeconds: 60 },
  { facilityType: FacilityType.ChemicalPlant, recipeName: RecipeName.SynthesizeFertilizer, expectedSeconds: 40 },
  { facilityType: FacilityType.ChemicalPlant, recipeName: RecipeName.ProducePlastic, expectedSeconds: 40 },
  { facilityType: FacilityType.ElectronicsFactory, recipeName: RecipeName.ProduceSilicon, expectedSeconds: 55 },
  { facilityType: FacilityType.ElectronicsFactory, recipeName: RecipeName.ProduceAdvancedComponents, expectedSeconds: 82.5 },
  { facilityType: FacilityType.AssemblyPlant, recipeName: RecipeName.AssembleIndustrialMachines, expectedSeconds: 105 },
  { facilityType: FacilityType.ConstructionFactory, recipeName: RecipeName.ProduceBricks, expectedSeconds: 15 },
  { facilityType: FacilityType.ConstructionFactory, recipeName: RecipeName.ProduceCement, expectedSeconds: 25 },
  { facilityType: FacilityType.ConstructionFactory, recipeName: RecipeName.ProduceReinforcedConcrete, expectedSeconds: 60 },
  { facilityType: FacilityType.ConstructionFactory, recipeName: RecipeName.ProduceConstructionMaterials, expectedSeconds: 120 },
  { facilityType: FacilityType.WaterWell, recipeName: RecipeName.ManualPumping, expectedSeconds: 4 },
  { facilityType: FacilityType.WaterWell, recipeName: RecipeName.ElectricPumping, expectedSeconds: 6.5 },
  { facilityType: FacilityType.PowerPlant, recipeName: RecipeName.CoalPower, expectedSeconds: 10 },
  { facilityType: FacilityType.PowerPlant, recipeName: RecipeName.SolarPower, expectedSeconds: 20 },
];

function getBaselineWorkPerMinute(facilityType: FacilityType): number {
  const facility = new Facility('test-1', facilityType);
  return calculateFacilityEffectiveWork(facility.getView(), 1);
}

describe('recipe balance', () => {
  it.each(RECIPE_TIMING_CASES)('$recipeName completes in the expected baseline time', ({ facilityType, recipeName, expectedSeconds }) => {
    const seconds = getRecipe(recipeName).requiredWork / getBaselineWorkPerMinute(facilityType) * 60;

    expect(seconds).toBeCloseTo(expectedSeconds, 1);
  });
});
