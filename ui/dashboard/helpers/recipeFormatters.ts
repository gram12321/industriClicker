import { getRecipeDisplayName, type Recipe } from '@/game/recipes';
import { getResource, getResourceIcon } from '@/game/resources/resourceConstants';
import { formatNumber } from '@/utils';

export function formatRecipeInputs(recipe: Recipe, options: { includeNames?: boolean } = {}): string {
  if (recipe.inputs.length === 0) return 'No inputs';

  return recipe.inputs
    .map(({ resourceType, amount }) => `${getResourceIcon(resourceType)}${options.includeNames === false ? '' : ` ${getResource(resourceType).name}`} ×${formatNumber(amount, { smartDecimals: true })}`)
    .join(' + ');
}

export function formatRecipeName(recipe: Recipe): string {
  return getRecipeDisplayName(recipe.name);
}

export function formatRecipeOutput(recipe: Recipe, options: { includeNames?: boolean } = {}): string {
  return `${getResourceIcon(recipe.output.resourceType)}${options.includeNames === false ? '' : ` ${getResource(recipe.output.resourceType).name}`} ×${formatNumber(recipe.output.amount, { smartDecimals: true })}`;
}

