export const SALES_CUSTOMER_DOMAINS = [
  'food',
  'raw-materials',
  'industrial-inputs',
  'construction-materials',
  'electronics',
  'utilities',
  'consumer-products',
] as const;

export type SalesCustomerDomain = typeof SALES_CUSTOMER_DOMAINS[number];

export const SALES_CUSTOMER_TYPES = [
  'local-businesses',
  'retail-chain',
  'construction-contractor',
  'industrial-enterprise',
  'utility-operator',
  'government-procurement',
] as const;

export type SalesCustomerType = typeof SALES_CUSTOMER_TYPES[number];

export type SalesCustomerDefinition = {
  id: string;
  name: string;
  domain: SalesCustomerDomain;
  customerType: SalesCustomerType;
  operatingDomains: SalesCustomerDomain[];
  marketShare: number;
  purchasingPower: number;
  bidMultiplier: number;
};

export type SalesResourceProfile = {
  domain: SalesCustomerDomain;
  standardOrderLot: number;
};

/** Relationship is stored as a normalized 0–1 value; UI displays it as 0–100. */
export type SalesCustomerState = {
  customerId: string;
  relationship: number;
  lastRelationshipUpdatedAtGameTimeMs: number;
  fulfilledOrderCount: number;
  expiredOrderCount: number;
};

export type SalesCustomerRelationshipDetails = {
  prestigeRecognition: number;
  prestigeBonus: number;
  marketSharePenalty: number;
  baseline: number;
  decayHalfLifeHours: number;
  relationshipValueScale: number;
  maximumFulfilmentGain: number;
  minimumFailureLoss: number;
  maximumRejectionLoss: number;
  maximumExpiryLoss: number;
};
