import { PRESTIGE_COMPANY_BALANCE_SOURCE_ID, PRESTIGE_EVENT_MIN_AMOUNT, PRESTIGE_EVENT_TYPES, PRESTIGE_SALES_HALF_LIFE_FOREGROUND_HOURS } from './prestigeConstants';
import { calculateCurrentPrestigeAmount, calculateSalesContractPrestige } from './prestigeCalculator';

export type PrestigeEventType = typeof PRESTIGE_EVENT_TYPES[number];

export type PrestigeEvent = {
  id: string;
  type: PrestigeEventType;
  amountBase: number;
  createdAtGameTimeMs: number;
  decayHalfLifeForegroundHours: number | null;
  sourceId: string;
  description: string;
};

export type PrestigeEventSnapshot = PrestigeEvent;

export type PrestigeLedgerSnapshot = {
  events: PrestigeEventSnapshot[];
  nextEventNumber: number;
};

type PrestigeEventInput = Omit<PrestigeEvent, 'id'>;

function cloneEvent(event: PrestigeEvent): PrestigeEvent {
  return { ...event };
}

function isPrestigeEventType(value: unknown): value is PrestigeEventType {
  return typeof value === 'string' && (PRESTIGE_EVENT_TYPES as readonly string[]).includes(value);
}

function isPrestigeEvent(value: unknown): value is PrestigeEvent {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const event = value as Record<string, unknown>;
  return (
    typeof event.id === 'string'
    && event.id.length > 0
    && isPrestigeEventType(event.type)
    && typeof event.amountBase === 'number'
    && Number.isFinite(event.amountBase)
    && typeof event.createdAtGameTimeMs === 'number'
    && Number.isFinite(event.createdAtGameTimeMs)
    && (event.decayHalfLifeForegroundHours === null
      || (typeof event.decayHalfLifeForegroundHours === 'number'
        && Number.isFinite(event.decayHalfLifeForegroundHours)
        && event.decayHalfLifeForegroundHours > 0))
    && typeof event.sourceId === 'string'
    && event.sourceId.length > 0
    && typeof event.description === 'string'
    && event.description.length > 0
  );
}

export function isPrestigeLedgerSnapshot(value: unknown): value is PrestigeLedgerSnapshot {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const snapshot = value as Record<string, unknown>;
  return (
    Array.isArray(snapshot.events)
    && snapshot.events.every(isPrestigeEvent)
    && typeof snapshot.nextEventNumber === 'number'
    && Number.isInteger(snapshot.nextEventNumber)
    && snapshot.nextEventNumber > 0
  );
}

/** Durable company-prestige events. Current values are derived from game time. */
export class PrestigeLedger {
  private events: PrestigeEvent[] = [];
  private nextEventNumber = 1;

  constructor(snapshot?: PrestigeLedgerSnapshot) {
    if (snapshot) {
      this.restore(snapshot);
    }
  }

  getEvents(): PrestigeEvent[] {
    return this.events.map(cloneEvent);
  }

  syncCompanyBalance(amountBase: number, createdAtGameTimeMs: number): void {
    this.upsert({
      type: 'company_balance',
      amountBase,
      createdAtGameTimeMs,
      decayHalfLifeForegroundHours: null,
      sourceId: PRESTIGE_COMPANY_BALANCE_SOURCE_ID,
      description: 'Company cash balance',
    });
  }

  recordSalesContract(contractId: string, reward: number, createdAtGameTimeMs: number): void {
    const amountBase = calculateSalesContractPrestige(reward);
    if (amountBase <= 0) {
      return;
    }

    this.recordIfAbsent({
      type: 'sales_contract',
      amountBase,
      createdAtGameTimeMs,
      decayHalfLifeForegroundHours: PRESTIGE_SALES_HALF_LIFE_FOREGROUND_HOURS,
      sourceId: `contract:${contractId}`,
      description: 'Customer contract fulfilled',
    });
  }

  recordIfAbsent(eventInput: PrestigeEventInput): boolean {
    if (!this.isValidInput(eventInput)
      || this.events.some((event) => event.type === eventInput.type && event.sourceId === eventInput.sourceId)) {
      return false;
    }

    this.events.push({
      ...eventInput,
      id: `prestige-${this.nextEventNumber}`,
    });
    this.nextEventNumber += 1;
    return true;
  }

  pruneExpired(currentGameTimeMs: number): boolean {
    const nextEvents = this.events.filter((event) => (
      event.decayHalfLifeForegroundHours === null
      || Math.abs(calculateCurrentPrestigeAmount(event, currentGameTimeMs)) >= PRESTIGE_EVENT_MIN_AMOUNT
    ));

    if (nextEvents.length === this.events.length) {
      return false;
    }

    this.events = nextEvents;
    return true;
  }

  clone(): PrestigeLedger {
    return PrestigeLedger.fromSnapshot(this.toSnapshot());
  }

  toSnapshot(): PrestigeLedgerSnapshot {
    return {
      events: this.getEvents(),
      nextEventNumber: this.nextEventNumber,
    };
  }

  static fromSnapshot(snapshot: PrestigeLedgerSnapshot): PrestigeLedger {
    return new PrestigeLedger(snapshot);
  }

  private upsert(eventInput: PrestigeEventInput): void {
    const index = this.events.findIndex((event) => (
      event.type === eventInput.type && event.sourceId === eventInput.sourceId
    ));

    if (index < 0) {
      this.recordIfAbsent(eventInput);
      return;
    }

    this.events[index] = {
      ...eventInput,
      id: this.events[index].id,
    };
  }

  private isValidInput(event: PrestigeEventInput): boolean {
    return (
      isPrestigeEventType(event.type)
      && Number.isFinite(event.amountBase)
      && Number.isFinite(event.createdAtGameTimeMs)
      && (event.decayHalfLifeForegroundHours === null
        || (Number.isFinite(event.decayHalfLifeForegroundHours) && event.decayHalfLifeForegroundHours > 0))
      && event.sourceId.length > 0
      && event.description.length > 0
    );
  }

  private restore(snapshot: PrestigeLedgerSnapshot): void {
    this.events = snapshot.events.map(cloneEvent);
    this.nextEventNumber = snapshot.nextEventNumber;
  }
}
