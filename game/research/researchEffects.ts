export type ResearchEffect =
  | { kind: 'grant'; amount: number }
  | { kind: 'max-open-sales-contracts'; maximum: number }
  | { kind: 'recipe-unlock'; recipeName: string }
  | { kind: 'recipe-time-bonus'; recipeName: string; level: number };

export function describeResearchEffect(effect: ResearchEffect): string {
  switch (effect.kind) {
    case 'grant': return `Grant €${effect.amount.toLocaleString()}`;
    case 'max-open-sales-contracts': return `Maximum open contracts: ${effect.maximum}`;
    case 'recipe-unlock': return `Unlock recipe: ${effect.recipeName}`;
    case 'recipe-time-bonus': return `Recipe time bonus: ${effect.recipeName} level ${effect.level}`;
  }
}
