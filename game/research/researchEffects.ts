import { getRecipeDisplayName, type RecipeName } from '@/game/recipes';

export type ResearchEffect =
  | { kind: 'grant'; amount: number }
  | { kind: 'max-open-sales-contracts'; maximum: number }
  | { kind: 'recipe-unlock'; recipeName: RecipeName }
  | { kind: 'recipe-work-speed-bonus'; recipeName: RecipeName; level: number };

export function describeResearchEffect(effect: ResearchEffect): string {
  switch (effect.kind) {
    case 'grant': return `Grant €${effect.amount.toLocaleString()}`;
    case 'max-open-sales-contracts': return `Maximum open contracts: ${effect.maximum}`;
    case 'recipe-unlock': return `Unlock recipe: ${getRecipeDisplayName(effect.recipeName)}`;
    case 'recipe-work-speed-bonus': return `Recipe work speed bonus: ${getRecipeDisplayName(effect.recipeName)} level ${effect.level}`;
  }
}
