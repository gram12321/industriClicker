import type { SalesCustomerDomain, SalesCustomerType } from './salesTypes';

/** Personal names used by owner-operated local businesses. */
export const SALES_CUSTOMER_FIRST_NAMES = [
  'Mia', 'Ben', 'Mai', 'Lena', 'Noah', 'Sofia', 'Leo', 'Amara', 'Theo', 'Nora',
  'Elena', 'Jonas', 'Clara', 'Sam', 'Iris', 'Luca', 'Ava', 'Maya', 'Eli', 'Ada',
] as const;

/** Brand fragments are selected by customer type, while trade language is selected by domain. */
export const SALES_CUSTOMER_NAME_BRANDS: Readonly<Record<SalesCustomerType, readonly string[]>> = {
  'private-customer': [],
  'retail-chain': ['Freshway', 'Marketline', 'Townsend', 'Evergreen', 'Cedar', 'Beacon', 'Union', 'Plaza'],
  'construction-contractor': ['Stonebridge', 'Anchor', 'Keystone', 'Buildwell', 'Granite', 'Rivet', 'Pillar', 'Terrace'],
  'industrial-enterprise': ['Meridian', 'Apex', 'Catalyst', 'Foundry', 'Helix', 'Ironclad', 'Vertex', 'Pioneer'],
  'utility-operator': ['NorthGrid', 'BlueRiver', 'Current', 'Delta', 'Reservoir', 'Powerline', 'Watermark', 'Volt'],
  'government-procurement': ['Municipal', 'Regional', 'Civic', 'Commonwealth', 'National', 'Public', 'Statewide', 'United'],
};

/** Every generated customer name includes a term from its home domain. */
export const SALES_CUSTOMER_DOMAIN_NAME_TERMS: Readonly<Record<SalesCustomerDomain, readonly string[]>> = {
  food: ['Drinks & Juices', 'Liquor Store', 'Delicatessen', 'Food Import', 'Provisions', 'Grocers'],
  'raw-materials': ['Stone & Sand', 'Ore Supply', 'Raw Materials', 'Mineral Trading', 'Aggregate Supply', 'Quarry Goods'],
  'industrial-inputs': ['Industrial Supply', 'Process Materials', 'Chemical Trading', 'Factory Inputs', 'Materials Trading', 'Process Goods'],
  'construction-materials': ['Building Supplies', 'Civil Materials', 'Construction Supply', 'Project Materials', 'Infrastructure', 'Site Supply'],
  electronics: ['Electronic Components', 'Circuit Supply', 'Device Systems', 'Technology Trading', 'Component Works', 'Electronics'],
  utilities: ['Water Services', 'Power Supply', 'Energy Services', 'Utility Network', 'Grid Services', 'Resource Utility'],
};

export const SALES_CUSTOMER_NAME_TYPE_SUFFIXES: Readonly<Record<Exclude<SalesCustomerType, 'private-customer' | 'retail-chain'>, readonly string[]>> = {
  'construction-contractor': ['Contractors', 'Builders', 'Works'],
  'industrial-enterprise': ['Enterprise', 'Industries', 'Systems'],
  'utility-operator': ['Services', 'Authority', 'Network'],
  'government-procurement': ['Procurement', 'Supply Office', 'Authority'],
};
