import type { Recipe } from '@/game/recipes/recipeTypes';
import { getResource } from '@/game/resources/resourcesRegistry';
import { formatNumber } from '@/utils';

export function formatRecipeInputs(recipe: Recipe): string {
  if (recipe.inputs.length === 0) return 'No inputs';

  return recipe.inputs
    .map(({ resourceType, amount }) => `${getResource(resourceType).name} ×${formatNumber(amount, { smartDecimals: true })}`)
    .join(' + ');
}

export function formatRecipeName(recipe: Recipe): string {
  switch (recipe.name) {
    case 'grow-grain': return 'Grow grain';
    case 'bake-bread': return 'Bake bread';
    case 'produce-water': return 'Produce water';
    case 'produce-electricity': return 'Produce electricity';
    default: return recipe.name;
  }
}

export function formatRecipeOutput(recipe: Recipe): string {
  return `${getResource(recipe.output.resourceType).name} ×${formatNumber(recipe.output.amount, { smartDecimals: true })}`;
}

