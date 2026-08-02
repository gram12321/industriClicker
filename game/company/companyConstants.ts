import type { StartingConditionId } from './companyTypes';

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
    openingFundsDescription: 'Opening funds follow the current Finance starting balance.',
  },
};
