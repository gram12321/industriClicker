import { getDeterministicUnitInterval } from './salesRandom';
import {
  SALES_CUSTOMER_DOMAIN_NAME_TERMS,
  SALES_CUSTOMER_FIRST_NAMES,
  SALES_CUSTOMER_NAME_BRANDS,
  SALES_CUSTOMER_NAME_TYPE_SUFFIXES,
} from './salesCustomerNameConstants';
import type { SalesCustomerDomain, SalesCustomerType } from './salesTypes';

function selectFrom<T>(values: readonly T[], seed: string): T {
  return values[Math.floor(getDeterministicUnitInterval(seed) * values.length)];
}

/** Creates a stable, readable identity whose form reflects type and vocabulary reflects home domain. */
export function generateSalesCustomerName(input: { seed: string; domain: SalesCustomerDomain; customerType: SalesCustomerType }): string {
  const domainTerm = selectFrom(SALES_CUSTOMER_DOMAIN_NAME_TERMS[input.domain], `${input.seed}:domain-term`);

  if (input.customerType === 'local-businesses') {
    return `${selectFrom(SALES_CUSTOMER_FIRST_NAMES, `${input.seed}:first-name`)}'s ${domainTerm}`;
  }

  const brand = selectFrom(SALES_CUSTOMER_NAME_BRANDS[input.customerType], `${input.seed}:brand`);
  if (input.customerType === 'retail-chain') return `${brand} ${domainTerm}`;

  const suffix = selectFrom(SALES_CUSTOMER_NAME_TYPE_SUFFIXES[input.customerType], `${input.seed}:type-suffix`);
  return `${brand} ${domainTerm} ${suffix}`;
}
