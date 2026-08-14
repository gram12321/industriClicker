import { describe, expect, it } from 'vitest';
import { Inventory } from '@/game/inventory';
import { ResourceType } from '@/game/resources';

describe('Inventory', () => {
  it('consumes repeated fractional quantities without a precision-caused shortfall', () => {
    const inventory = new Inventory();
    const dose = 0.025;
    inventory.add(ResourceType.Fertilizer, dose * 20);

    for (let cycle = 0; cycle < 20; cycle += 1) {
      expect(inventory.remove(ResourceType.Fertilizer, dose)).toBe(true);
    }

    expect(inventory.getAmount(ResourceType.Fertilizer)).toBe(0);
  });
});
