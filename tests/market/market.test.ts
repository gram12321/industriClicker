import { describe, expect, it } from 'vitest';
import { Market } from '@/game/market';
import { MARKET_DIFFUSION_INTERVAL_MS } from '@/game/market/marketConstants';
import { ResourceType } from '@/game/resources';

describe('Market regional tier', () => {
  it('diffuses between both adjacent tiers without changing total supply', () => {
    const market = new Market();
    const snapshot = market.toSnapshot();
    snapshot.local[ResourceType.Grain].supply = 250;
    snapshot.regional[ResourceType.Grain].supply = 50_000;
    const perturbed = Market.fromSnapshot(snapshot);
    const totalBefore = perturbed.getLocalEntry(ResourceType.Grain).supply
      + perturbed.getRegionalEntry(ResourceType.Grain).supply
      + perturbed.getGlobalEntry(ResourceType.Grain).supply;

    expect(perturbed.getLocalRegionalDiffusionInfo(ResourceType.Grain).direction).toBe('to-local');
    expect(perturbed.getRegionalGlobalDiffusionInfo(ResourceType.Grain).direction).toBe('to-regional');
    perturbed.diffuse();

    const totalAfter = perturbed.getLocalEntry(ResourceType.Grain).supply
      + perturbed.getRegionalEntry(ResourceType.Grain).supply
      + perturbed.getGlobalEntry(ResourceType.Grain).supply;
    expect(totalAfter).toBeCloseTo(totalBefore);
  });

  it('uses equal diffusion pressure for equal high and low price divergences', () => {
    const highPriceSnapshot = new Market().toSnapshot();
    highPriceSnapshot.local[ResourceType.Grain].supply = 100;
    const lowPriceSnapshot = new Market().toSnapshot();
    lowPriceSnapshot.local[ResourceType.Grain].supply = 10_000;

    const highPriceDetails = Market.fromSnapshot(highPriceSnapshot).getLocalRegionalDiffusionDetails(ResourceType.Grain);
    const lowPriceDetails = Market.fromSnapshot(lowPriceSnapshot).getLocalRegionalDiffusionDetails(ResourceType.Grain);

    expect(highPriceDetails.direction).toBe('to-local');
    expect(lowPriceDetails.direction).toBe('to-regional');
    expect(highPriceDetails.priceGap).toBeCloseTo(9);
    expect(lowPriceDetails.priceGap).toBeCloseTo(9);
    expect(highPriceDetails.rawAmount).toBeCloseTo(lowPriceDetails.rawAmount);
  });

  it('uses regional initial supply as the local-regional diffusion rate base', () => {
    const snapshot = new Market().toSnapshot();
    snapshot.local[ResourceType.Grain].supply = 1_198.47;
    snapshot.regional[ResourceType.Grain].supply = 100_000.59;

    const details = Market.fromSnapshot(snapshot).getLocalRegionalDiffusionDetails(ResourceType.Grain);

    expect(details.direction).toBe('to-regional');
    expect(details.rawAmount).toBeGreaterThan(20);
    expect(details.rawAmount).toBeLessThan(21);
  });

  it('applies market diffusion research only to local-regional raw requests', () => {
    const snapshot = new Market().toSnapshot();
    snapshot.local[ResourceType.Grain].supply = 1_198.47;
    snapshot.regional[ResourceType.Grain].supply = 100_000.59;
    const market = Market.fromSnapshot(snapshot);
    const localRegionalBefore = market.getLocalRegionalDiffusionDetails(ResourceType.Grain);
    const regionalGlobalBefore = market.getRegionalGlobalDiffusionDetails(ResourceType.Grain);

    expect(market.setLocalRegionalDiffusionMultiplier(4)).toBe(true);

    expect(market.getLocalRegionalDiffusionDetails(ResourceType.Grain).rawAmount).toBeCloseTo(localRegionalBefore.rawAmount * 4);
    expect(market.getRegionalGlobalDiffusionDetails(ResourceType.Grain).rawAmount).toBeCloseTo(regionalGlobalBefore.rawAmount);
  });

  it('scales five-second diffusion while preserving the 50% per-minute equilibrium cap', () => {
    const snapshot = new Market().toSnapshot();
    snapshot.local[ResourceType.Grain].supply = 1;
    const market = Market.fromSnapshot(snapshot);
    const perMinute = market.getLocalRegionalDiffusionDetails(ResourceType.Grain);
    const perInterval = market.getLocalRegionalDiffusionDetails(ResourceType.Grain, MARKET_DIFFUSION_INTERVAL_MS);
    const equilibriumDistance = perMinute.lowerTargetSupply - snapshot.local[ResourceType.Grain].supply;

    expect(perInterval.rawAmount).toBeCloseTo(perMinute.rawAmount / 12);
    expect(perMinute.amount).toBeCloseTo(equilibriumDistance * 0.5);
    expect(perInterval.amount).toBeCloseTo(equilibriumDistance * (1 - 0.5 ** (1 / 12)));
  });

  it('expands local market depth without changing its price', () => {
    const market = new Market();
    const priceBefore = market.getLocalPrice(ResourceType.Grain);
    const supplyBefore = market.getLocalEntry(ResourceType.Grain).supply;

    expect(market.setLocalMarketDepthMultiplier(1.5)).toBe(true);
    expect(market.getLocalEntry(ResourceType.Grain).supply).toBeCloseTo(supplyBefore * 1.5);
    expect(market.getLocalPrice(ResourceType.Grain)).toBeCloseTo(priceBefore);
  });

  it('activates fixed baseline market stock over foreground time, even when the local pool is depleted', () => {
    const snapshot = new Market().toSnapshot();
    snapshot.local[ResourceType.Grain].supply = 10;
    const market = Market.fromSnapshot(snapshot);

    expect(market.startLocalMarketNetworkActivation('local-market-network-1', 0.2)).toBe(true);
    expect(market.advanceLocalMarketNetworkActivations(60_000)).toBe(true);
    expect(market.getLocalEntry(ResourceType.Grain).supply).toBeCloseTo(60);
    expect(market.getLocalPrice(ResourceType.Grain)).toBeCloseTo(14);
    expect(market.getLocalMarketNetworkActivations()).toMatchObject([{ projectId: 'local-market-network-1', totalDepthIncrease: 0.2, appliedDepthIncrease: 0.05 }]);

    market.advanceLocalMarketNetworkActivations(180_000);
    expect(market.getLocalEntry(ResourceType.Grain).supply).toBeCloseTo(210);
    expect(market.getLocalPrice(ResourceType.Grain)).toBeCloseTo(960 / 210);
    expect(market.getLocalMarketNetworkActivations()).toEqual([]);
  });

  it('runs separate market-network activations simultaneously and retains them in a snapshot', () => {
    const market = new Market();
    expect(market.startLocalMarketNetworkActivation('local-market-network-1', 0.2)).toBe(true);
    expect(market.startLocalMarketNetworkActivation('local-market-network-2', 0.3)).toBe(true);

    market.advanceLocalMarketNetworkActivations(60_000);
    const restored = Market.fromSnapshot(market.toSnapshot());

    expect(restored.getLocalEntry(ResourceType.Grain).supply).toBeCloseTo(1_100);
    expect(restored.getLocalPrice(ResourceType.Grain)).toBeCloseTo(0.8);
    expect(restored.getLocalMarketNetworkActivations()).toMatchObject([
      { projectId: 'local-market-network-1', appliedDepthIncrease: 0.05 },
      { projectId: 'local-market-network-2', appliedDepthIncrease: 0.05 },
    ]);
  });

  it('uses the changing market price across a trade so a round trip cannot create cash', () => {
    const market = new Market();
    const amount = market.getLocalEntry(ResourceType.Grain).supply;

    const purchase = market.buyFromLocal(ResourceType.Grain, amount);
    const sale = market.sellToLocal(ResourceType.Grain, amount, purchase.quality);

    expect(purchase.success).toBe(true);
    expect(purchase.unitPrice).toBeGreaterThan(0.8);
    expect(sale.success).toBe(true);
    expect(sale.unitPrice * sale.amount).toBeCloseTo(purchase.unitPrice * purchase.amount);
    expect(market.getLocalPrice(ResourceType.Grain)).toBeCloseTo(0.8);
  });

  it('caps an all-market purchase using the slippage-adjusted execution cost', () => {
    const market = new Market();
    const resourceType = ResourceType.Grain;
    const availableSupply = Math.floor(market.getLocalEntry(resourceType).supply);
    const spotPrice = market.getLocalPrice(resourceType);
    const cash = spotPrice * availableSupply;
    const affordableAmount = market.getMaximumLocalPurchaseAmountAtCash(resourceType, cash);

    expect(affordableAmount).toBeLessThan(availableSupply);
    const affordableQuote = market.getLocalBuyQuote(resourceType, affordableAmount);
    const nextQuote = market.getLocalBuyQuote(resourceType, affordableAmount + 1);
    expect(affordableQuote.success).toBe(true);
    expect(nextQuote.success).toBe(true);
    expect(affordableQuote.unitPrice * affordableQuote.amount).toBeLessThanOrEqual(cash);
    expect(nextQuote.unitPrice * nextQuote.amount).toBeGreaterThan(cash);
  });

  it('starts Plastic and Fertilizer with deeper local markets at their existing prices', () => {
    const market = new Market();

    expect(market.getLocalEntry(ResourceType.Plastic).supply).toBe(150);
    expect(market.getLocalPrice(ResourceType.Plastic)).toBeCloseTo(15);
    expect(market.getLocalEntry(ResourceType.Fertilizer).supply).toBe(150);
    expect(market.getLocalPrice(ResourceType.Fertilizer)).toBeCloseTo(10);
  });

  it('pays the sold inventory quality and mixes it into the local market', () => {
    const market = new Market();
    const initialLocal = market.getLocalEntry(ResourceType.Grain);
    const initialUnitPrice = market.getLocalSalePrice(ResourceType.Grain, 2);
    const expectedPostTradePrice = initialUnitPrice * initialLocal.supply / (initialLocal.supply + 10);

    const trade = market.sellToLocal(ResourceType.Grain, 10, 2);

    expect(trade).toMatchObject({ success: true, amount: 10, quality: 2 });
    expect(trade.unitPrice).toBeCloseTo((initialUnitPrice + expectedPostTradePrice) / 2);
    expect(trade.unitPrice).toBeLessThan(initialUnitPrice);
    expect(market.getLocalEntry(ResourceType.Grain).quality).toBeCloseTo(
      (initialLocal.supply * initialLocal.quality + 10 * 2) / (initialLocal.supply + 10),
    );
  });

  it('mixes source quality into the receiving pool during diffusion', () => {
    const snapshot = new Market().toSnapshot();
    snapshot.local[ResourceType.Grain] = { supply: 100, quality: 1 };
    snapshot.regional[ResourceType.Grain] = { supply: 200_000, quality: 2 };
    const market = Market.fromSnapshot(snapshot);

    const details = market.getLocalRegionalDiffusionDetails(ResourceType.Grain);
    market.diffuse();

    expect(market.getLocalEntry(ResourceType.Grain).quality).toBeGreaterThan(1);
    expect(details.equilibriumQuality).toBeGreaterThan(1);
    expect(details.lowerQualityChangePerMinute).toBeGreaterThan(0);
  });

});
