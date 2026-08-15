import { describe, expect, it } from 'vitest';
import { ResourceType, RESOURCE_TYPES } from '@/game/resources';
import { SALES_ORDER_DURATION_MS, SalesOrders, calculateSalesOrderAcquisitionChance } from '@/game/sales';

function quantities(resourceType: ResourceType, amount: number): Record<ResourceType, number> {
  return RESOURCE_TYPES.reduce((result, candidate) => { result[candidate] = candidate === resourceType ? amount : 0; return result; }, {} as Record<ResourceType, number>);
}
function prices(value: number): Record<ResourceType, number> { return RESOURCE_TYPES.reduce((result, resourceType) => { result[resourceType] = value; return result; }, {} as Record<ResourceType, number>); }

describe('sales orders', () => {
  it('requires a meaningful utility lot and locks bid, reference price, and premium', () => {
    const orders = new SalesOrders();
    const result = orders.advanceTime({ currentGameTimeMs: 60_000, maximumOpenOrders: 2, companyPrestige: 500, economyPhase: 'boom', inventoryByResource: quantities(ResourceType.Water, 1_000), globalPrices: prices(1), candidateResourceTypes: [ResourceType.Water], getResourceWeight: () => 1, bidResearchMultiplier: 1 });
    expect(result.ordersCreated).toBe(1);
    const order = orders.getOfferedOrders()[0];
    expect(order.resourceType).toBe(ResourceType.Water);
    expect(order.quantity % 500).toBe(0);
    expect(order.globalReferenceUnitPrice).toBe(1);
    expect(order.bidUnitPrice).toBeGreaterThan(0);
    expect(order.reward).toBe(order.quantity * order.bidUnitPrice);
  });

  it('does not acquire orders without an inventory lot and lowers chance for pending orders', () => {
    expect(calculateSalesOrderAcquisitionChance({ openOrderCount: 0, companyPrestige: 0, economyPhase: 'stable', hasEligibleInventory: false })).toBe(0);
    expect(calculateSalesOrderAcquisitionChance({ openOrderCount: 2, companyPrestige: 0, economyPhase: 'stable', hasEligibleInventory: true })).toBeLessThan(calculateSalesOrderAcquisitionChance({ openOrderCount: 0, companyPrestige: 0, economyPhase: 'stable', hasEligibleInventory: true }));
  });

  it('changes relationship for fulfilment and expiry', () => {
    const orders = new SalesOrders();
    orders.advanceTime({ currentGameTimeMs: 60_000, maximumOpenOrders: 2, companyPrestige: 500, economyPhase: 'boom', inventoryByResource: quantities(ResourceType.Water, 1_000), globalPrices: prices(1), candidateResourceTypes: [ResourceType.Water], getResourceWeight: () => 1, bidResearchMultiplier: 1 });
    const order = orders.getOfferedOrders()[0]; const before = orders.getCustomerState(order.customerId, 60_000, 500).relationship;
    orders.fulfill(order.id, 61_000, 500);
    expect(orders.getCustomerState(order.customerId, 61_000, 500).relationship).toBeGreaterThan(before);
    orders.createDevelopmentOrderForResource(ResourceType.Water, 500, 1, 2, 62_000, 500);
    const expiring = orders.getOfferedOrders()[0]; const beforeExpiry = orders.getCustomerState(expiring.customerId, 62_000, 500).relationship;
    orders.advanceTime({ currentGameTimeMs: expiring.expiresAtGameTimeMs + SALES_ORDER_DURATION_MS, maximumOpenOrders: 2, companyPrestige: 500, economyPhase: 'boom', inventoryByResource: quantities(ResourceType.Water, 1_000), globalPrices: prices(1), candidateResourceTypes: [ResourceType.Water], getResourceWeight: () => 1, bidResearchMultiplier: 1 });
    expect(orders.getCompletedOrders().some((candidate) => candidate.status === 'expired')).toBe(true);
    expect(orders.getCustomerState(expiring.customerId, expiring.expiresAtGameTimeMs + SALES_ORDER_DURATION_MS, 500).relationship).toBeLessThan(beforeExpiry);
  });

  it('persists company order and relationship state without persisting the customer catalogue', () => {
    const orders = new SalesOrders();
    orders.createDevelopmentOrderForResource(ResourceType.Water, 500, 1, 2, 60_000, 20);
    const offered = orders.getOfferedOrders()[0];
    orders.fulfill(offered.id, 61_000, 20);
    const snapshot = orders.toSnapshot();
    expect('customers' in snapshot).toBe(false);
    const restored = SalesOrders.fromSnapshot(snapshot);
    expect(restored.getCompletedOrders()).toHaveLength(1);
    expect(restored.getCustomerStates()).toHaveLength(1);
    expect(restored.getCustomerCatalogue().length).toBeGreaterThan(18);
  });
});
