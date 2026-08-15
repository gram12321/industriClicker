import type { StartingConditionId } from './companyTypes';

/** Starting inventory for the Standard start. */
export const STANDARD_START_CONSTRUCTION_MATERIALS = 10;
export const STANDARD_START_INDUSTRIAL_MACHINES = 1;

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
    openingFundsDescription: 'Start with €100, 10 Construction Materials, and 1 Industrial Machine.',
  },
};
