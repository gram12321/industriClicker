import type { Recipe } from '@/game/recipes/recipeTypes';
import { getResource, getResourceIcon } from '@/game/resources/resourceConstants';
import { formatNumber } from '@/utils';

export function formatRecipeInputs(recipe: Recipe, options: { includeNames?: boolean } = {}): string {
  if (recipe.inputs.length === 0) return 'No inputs';

  return recipe.inputs
    .map(({ resourceType, amount }) => `${getResourceIcon(resourceType)}${options.includeNames === false ? '' : ` ${getResource(resourceType).name}`} ×${formatNumber(amount, { smartDecimals: true })}`)
    .join(' + ');
}

export function formatRecipeName(recipe: Recipe): string {
  switch (recipe.name) {
    case 'grow-grain': return 'Grow grain';
    case 'bake-bread': return 'Bake bread';
    case 'produce-water': return 'Produce water';
    case 'produce-electricity': return 'Produce electricity';
    case 'grow-sugar': return 'Grow sugar';
    case 'mine-iron': return 'Mine iron';
    case 'mine-coal': return 'Mine coal';
    case 'mine-copper': return 'Mine copper';
    case 'quarry-sand': return 'Quarry sand';
    case 'quarry-clay': return 'Quarry clay';
    case 'quarry-stone': return 'Quarry stone';
    case 'produce-steel': return 'Produce steel';
    case 'produce-electric-circuits': return 'Produce electric circuits';
    case 'produce-bricks': return 'Produce bricks';
    case 'produce-cement': return 'Produce cement';
    case 'produce-reinforced-concrete': return 'Produce reinforced concrete';
    case 'produce-construction-materials': return 'Produce construction materials';
    case 'bake-cake': return 'Bake cake';
    case 'manual-pumping': return 'Manual pumping';
    case 'electric-pumping': return 'Electric pumping';
    case 'coal-power': return 'Coal power';
    case 'solar-power': return 'Solar power';
    default: return recipe.name;
  }
}

export function formatRecipeOutput(recipe: Recipe, options: { includeNames?: boolean } = {}): string {
  return `${getResourceIcon(recipe.output.resourceType)}${options.includeNames === false ? '' : ` ${getResource(recipe.output.resourceType).name}`} ×${formatNumber(recipe.output.amount, { smartDecimals: true })}`;
}

