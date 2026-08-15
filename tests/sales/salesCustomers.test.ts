import { describe, expect, it } from 'vitest';
import { ResourceType } from '@/game/resources';
import { SALES_CUSTOMER_DOMAINS, SALES_CUSTOMER_TYPE_PROFILES, SALES_CUSTOMER_TYPES, advanceSalesCustomerRelationship, calculateSalesCustomerRelationshipBaseline, calculateSalesCustomerRelationshipChange, calculateSalesCustomerRelationshipDetails, createSalesCustomerState, getSalesCustomerCatalogue, getSalesCustomerRelationshipLabel, getSalesResourceProfile } from '@/game/sales';

describe('sales customer catalogue', () => {
  it('is deterministic and generates variable customer counts that normalize market share within each domain', () => {
    const catalogue = getSalesCustomerCatalogue();

    expect(getSalesCustomerCatalogue()).toEqual(catalogue);
    for (const domain of SALES_CUSTOMER_DOMAINS) {
      const share = catalogue
        .filter((customer) => customer.domain === domain)
        .reduce((total, customer) => total + customer.marketShare, 0);
      expect(share).toBeCloseTo(1);
    }
    expect(new Set(SALES_CUSTOMER_DOMAINS.map((domain) => catalogue.filter((customer) => customer.domain === domain).length)).size).toBeGreaterThan(1);
    expect(catalogue.some((customer) => customer.marketShare < 0.01)).toBe(true);
    expect(catalogue.every((customer) => customer.bidMultiplier > 0)).toBe(true);
  });

  it('uses commercial delivery lots that vary by resource scale', () => {
    expect(getSalesResourceProfile(ResourceType.Water)).toEqual({ domain: 'utilities', standardOrderLot: 500 });
    expect(getSalesResourceProfile(ResourceType.Electricity)).toEqual({ domain: 'utilities', standardOrderLot: 250 });
    expect(getSalesResourceProfile(ResourceType.Sand).standardOrderLot).toBeGreaterThan(getSalesResourceProfile(ResourceType.Grain).standardOrderLot);
    expect(getSalesResourceProfile(ResourceType.IndustrialMachines).standardOrderLot).toBe(1);
  });

  it('gives customers an independent type and deterministic operating-domain scope', () => {
    const catalogue = getSalesCustomerCatalogue();
    expect(SALES_CUSTOMER_TYPES.every((customerType) => catalogue.some((customer) => customer.customerType === customerType))).toBe(true);
    for (const customer of catalogue) {
      expect(customer.operatingDomains).toContain(customer.domain);
      expect(customer.operatingDomains.every((domain) => SALES_CUSTOMER_TYPE_PROFILES[customer.customerType].allowedOperatingDomains.includes(domain))).toBe(true);
    }
  });

  it('makes large market shares rare for private customers', () => {
    const catalogue = getSalesCustomerCatalogue();
    const privateCustomers = catalogue.filter((customer) => customer.customerType === 'private-customer');
    const largerBuyers = catalogue.filter((customer) => customer.customerType !== 'private-customer');

    expect(Math.max(...privateCustomers.map((customer) => customer.marketShare))).toBeLessThan(0.25);
    expect(largerBuyers.some((customer) => customer.marketShare > 0.1)).toBe(true);
  });

  it('keeps purchasing power broad and independently distributed from bid profile', () => {
    const catalogue = getSalesCustomerCatalogue();
    expect(Math.max(...catalogue.map((customer) => customer.purchasingPower))).toBeGreaterThan(1.5);
    expect(Math.min(...catalogue.map((customer) => customer.purchasingPower))).toBeLessThan(0.7);
    expect(new Set(catalogue.map((customer) => `${customer.purchasingPower}:${customer.bidMultiplier}`)).size).toBeGreaterThan(catalogue.length * 0.7);
  });

  it('decays company relationship toward the current prestige-derived baseline', () => {
    const customer = getSalesCustomerCatalogue().find((candidate) => candidate.domain === 'utilities')!;
    const baseline = calculateSalesCustomerRelationshipBaseline(customer, 100);
    const state = createSalesCustomerState(customer.id, 0.8, 0);
    const advanced = advanceSalesCustomerRelationship(state, customer, 100, 8 * 60 * 60 * 1_000);

    expect(advanced.relationship).toBeCloseTo((0.8 + baseline) / 2);
  });

  it('uses only prestige as the relationship-baseline source and exposes the directory inputs', () => {
    const customer = getSalesCustomerCatalogue()[0];
    const details = calculateSalesCustomerRelationshipDetails(customer, 100);
    const zeroPrestige = calculateSalesCustomerRelationshipDetails(customer, 0);

    expect(details.prestigeBonus).toBeGreaterThan(0);
    expect(details.maximumFulfilmentGain).toBeGreaterThan(0);
    expect(details.maximumRejectionLoss).toBeGreaterThan(details.minimumFailureLoss);
    expect(details.maximumExpiryLoss).toBeGreaterThan(details.maximumRejectionLoss);
    expect(zeroPrestige.baseline).toBe(0);
  });

  it('scales fulfilment gains with value and slows them as relationship rises', () => {
    const customer = getSalesCustomerCatalogue()[0];
    const smallOrderGain = calculateSalesCustomerRelationshipChange({ outcome: 'fulfilled', customer, relationship: 0, orderReferenceValue: 100 });
    const largeOrderGain = calculateSalesCustomerRelationshipChange({ outcome: 'fulfilled', customer, relationship: 0, orderReferenceValue: 1_000 });
    const trustedCustomerGain = calculateSalesCustomerRelationshipChange({ outcome: 'fulfilled', customer, relationship: 0.8, orderReferenceValue: 1_000 });

    expect(largeOrderGain).toBeGreaterThan(smallOrderGain);
    expect(trustedCustomerGain).toBeLessThan(largeOrderGain);
  });

  it('makes expiry harsher than rejection only for high-trust, high-value orders', () => {
    const customer = getSalesCustomerCatalogue()[0];
    const lowRelationshipLoss = calculateSalesCustomerRelationshipChange({ outcome: 'rejected', customer, relationship: 0, orderReferenceValue: 100 });
    const highRelationshipRejection = calculateSalesCustomerRelationshipChange({ outcome: 'rejected', customer, relationship: 1, orderReferenceValue: 1_000_000_000 });
    const highRelationshipExpiry = calculateSalesCustomerRelationshipChange({ outcome: 'expired', customer, relationship: 1, orderReferenceValue: 1_000_000_000 });

    expect(lowRelationshipLoss).toBeCloseTo(-0.0001);
    expect(highRelationshipRejection).toBeCloseTo(-0.1, 5);
    expect(highRelationshipExpiry).toBeCloseTo(-0.2, 5);
  });

  it('uses readable relationship tiers at the important trust thresholds', () => {
    expect(getSalesCustomerRelationshipLabel(0)).toBe('Cold lead');
    expect(getSalesCustomerRelationshipLabel(0.15)).toBe('New face');
    expect(getSalesCustomerRelationshipLabel(0.85)).toBe('First-call supplier');
    expect(getSalesCustomerRelationshipLabel(1)).toBe('Strategic partner');
  });
});
