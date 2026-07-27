import type { Recipe } from '@/game/recipes/recipeTypes';
import { getResource } from '@/game/resources/resourcesRegistry';

export function formatRecipeInputs(recipe: Recipe): string { return formatRecipeInputList(recipe.inputs); }
function formatRecipeInputList(inputs: Recipe['inputs']): string {
  if (inputs.length === 0) return 'No inputs';
  return inputs.map(({ resourceType, amount }) => `${getResource(resourceType).name} ×${amount}`).join(' + ');
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
export function formatRecipeOutput(recipe: Recipe): string { return `${getResource(recipe.output.resourceType).name} ×${recipe.output.amount}`; }
export function formatPercent(value: number): string { return `${value.toFixed(0)}%`; }
export function formatTimeRemaining(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes === 0 ? `${hours} h` : `${hours} h ${remainingMinutes} min`;
}
export function formatCurrency(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const formattedAmount = Math.abs(amount).toLocaleString('en-US', { maximumFractionDigits: 2 });
  return `${sign}€ ${formattedAmount}`;
}
