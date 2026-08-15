import { describe, expect, it } from 'vitest';
import { ResourceType } from '@/game/resources';
import { SALES_CUSTOMER_DOMAINS, SALES_CUSTOMER_TYPE_PROFILES, SALES_CUSTOMER_TYPES, advanceSalesCustomerRelationship, calculateSalesCustomerRelationshipBaseline, createSalesCustomerState, getSalesCustomerCatalogue, getSalesResourceProfile } from '@/game/sales';

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

  it('places water and electricity in the utilities domain with meaningful delivery lots', () => {
    expect(getSalesResourceProfile(ResourceType.Water)).toEqual({ domain: 'utilities', standardOrderLot: 500 });
    expect(getSalesResourceProfile(ResourceType.Electricity)).toEqual({ domain: 'utilities', standardOrderLot: 250 });
  });

  it('gives customers an independent type and deterministic operating-domain scope', () => {
    const catalogue = getSalesCustomerCatalogue();
    expect(SALES_CUSTOMER_TYPES.every((customerType) => catalogue.some((customer) => customer.customerType === customerType))).toBe(true);
    for (const customer of catalogue) {
      expect(customer.operatingDomains).toContain(customer.domain);
      expect(customer.operatingDomains.every((domain) => SALES_CUSTOMER_TYPE_PROFILES[customer.customerType].allowedOperatingDomains.includes(domain))).toBe(true);
    }
  });

  it('decays company relationship toward the current prestige-derived baseline', () => {
    const customer = getSalesCustomerCatalogue().find((candidate) => candidate.domain === 'utilities')!;
    const baseline = calculateSalesCustomerRelationshipBaseline(customer, 100);
    const state = createSalesCustomerState(customer.id, 80, 0);
    const advanced = advanceSalesCustomerRelationship(state, customer, 100, 8 * 60 * 60 * 1_000);

    expect(advanced.relationship).toBeCloseTo((80 + baseline) / 2);
  });
});
