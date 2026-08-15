import type { StartingConditionId } from './companyTypes';

/** Starting inventory for the Standard start. */
export const FINANCE_INITIAL_BALANCE = 200;
export const STANDARD_START_CONSTRUCTION_MATERIALS = 10;
export const STANDARD_START_INDUSTRIAL_MACHINES = 3;

export type StartingCondition = {
  id: StartingConditionId;
  name: string;
  description: string;
  openingFundsDescription: string;
};

/** Code-owned company setup catalogue. Add new balanced starts here when approved. */
export const STARTING_CONDITIONS: Readonly<Record<StartingConditionId, StartingCondition>> = {
  standard: {
    id: 'standard',
    name: 'Standard start',
    description: 'Begin with the current Industri Clicker opening company state.',
    openingFundsDescription: 'Start with €200, 10 Construction Materials, and 3 Industrial Machines.',
  },
};
