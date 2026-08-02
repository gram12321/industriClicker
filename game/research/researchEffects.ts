export type ResearchEffect =
  | { kind: 'grant'; amount: number }
  | { kind: 'max-open-sales-contracts'; maximum: number };

export function describeResearchEffect(effect: ResearchEffect): string {
  switch (effect.kind) {
    case 'grant': return `Grant €${effect.amount.toLocaleString()}`;
    case 'max-open-sales-contracts': return `Maximum open contracts: ${effect.maximum}`;
  }
}
