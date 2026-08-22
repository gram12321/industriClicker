import { getRecipeDisplayName, type RecipeName } from '@/game/recipes';
import { getResource, type ResourceType } from '@/game/resources';

export type ResearchEffect =
  | { kind: 'grant'; amount: number }
  | { kind: 'max-open-sales-orders'; maximum: number }
  | { kind: 'sales-order-value-cap'; maximumCompanyValueFraction: number }
  | { kind: 'sales-order-bid-multiplier'; multiplier: number }
  | { kind: 'sales-relationship-decay-half-life'; multiplier: number }
  | { kind: 'sales-relationship-fulfilment-gain'; multiplier: number }
  | { kind: 'sales-relationship-failure-loss'; multiplier: number }
  | { kind: 'sales-pressure-offer-chance'; multiplier: number }
  | { kind: 'sales-order-bundle-maturity'; multiplier: number }
  | { kind: 'sales-order-minimum-premium-bonus'; bonus: number }
  | { kind: 'sales-offer-produced-resource-weight'; multiplier: number }
  | { kind: 'sales-offer-produced-only' }
  | { kind: 'local-market-depth'; multiplier: number }
  | { kind: 'local-regional-diffusion'; multiplier: number }
  | { kind: 'research-capacity'; additionalSlots: number }
  | { kind: 'recipe-unlock'; recipeName: RecipeName }
  | { kind: 'recipe-work-speed-bonus'; recipeName: RecipeName; level: number }
  | { kind: 'facility-auto-repair'; maximumFacilities: number }
  | { kind: 'resource-production-quality'; resourceType: ResourceType; level: number; quality: number };

export function describeResearchEffect(effect: ResearchEffect): string {
  switch (effect.kind) {
    case 'grant': return `Grant €${effect.amount.toLocaleString()}`;
    case 'max-open-sales-orders': return `Maximum open orders: ${effect.maximum}`;
    case 'sales-order-value-cap': return `Maximum order value: ${Math.round(effect.maximumCompanyValueFraction * 100)}% of company assets`;
    case 'sales-order-bid-multiplier': return `Customer-order bid premium: ${Math.round((effect.multiplier - 1) * 100)}%`;
    case 'sales-relationship-decay-half-life': return `Customer relationship retention: +${Math.round((effect.multiplier - 1) * 100)}%`;
    case 'sales-relationship-fulfilment-gain': return `Relationship gain on fulfilment: +${Math.round((effect.multiplier - 1) * 100)}%`;
    case 'sales-relationship-failure-loss': return `Relationship loss on rejection/expiry: ${Math.round((1 - effect.multiplier) * 100)}% lower`;
    case 'sales-pressure-offer-chance': return `Below-global pressure-offer chance: ${Math.round((1 - effect.multiplier) * 100)}% lower`;
    case 'sales-order-bundle-maturity': return `Bundle maturity growth: +${Math.round((effect.multiplier - 1) * 100)}%`;
    case 'sales-order-minimum-premium-bonus': return `Minimum bid premium floor: +${Math.round(effect.bonus * 100)} pts`;
    case 'sales-offer-produced-resource-weight': return `Produced resources are ${effect.multiplier}× more likely in sales offers`;
    case 'sales-offer-produced-only': return 'Customer orders only request resources your company has produced';
    case 'local-market-depth': return `Activate local market depth: ${effect.multiplier.toFixed(1)}×`;
    case 'local-regional-diffusion': return `Local-regional diffusion rate: ${effect.multiplier.toFixed(2)}×`;
    case 'research-capacity': return `Additional simultaneous research projects: ${effect.additionalSlots}`;
    case 'recipe-unlock': return `Unlock recipe: ${getRecipeDisplayName(effect.recipeName)}`;
    case 'recipe-work-speed-bonus': return `Recipe work speed bonus: ${getRecipeDisplayName(effect.recipeName)} level ${effect.level}`;
    case 'facility-auto-repair': return `Auto-repair enabled for up to ${effect.maximumFacilities} facilities`;
    case 'resource-production-quality': return `${getResource(effect.resourceType).name} production quality: Q${effect.quality.toFixed(2)}`;
  }
}
