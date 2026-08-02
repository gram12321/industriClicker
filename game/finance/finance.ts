import { FINANCE_INITIAL_BALANCE } from './financeConstants';

export type FinanceTransaction = {
  amount: number;
  description: string;
  balanceAfter: number;
  occurredAt: string;
};

/** Plain, JSON-safe representation stored in the active company's SQLite game save. */
export type FinanceSnapshot = {
  balance: number;
  transactions: FinanceTransaction[];
};

function isValidBalance(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

/**
 * Player money and its transaction history.
 *
 * Callers record a signed amount: positive for income and negative for a cost.
 */
export class Finance {
  private balance = FINANCE_INITIAL_BALANCE;
  private transactions: FinanceTransaction[] = [];

  constructor(snapshot?: FinanceSnapshot) {
    if (snapshot) {
      this.restore(snapshot);
    }
  }

  getBalance(): number {
    return this.balance;
  }

  canAfford(cost: number): boolean {
    return Number.isFinite(cost) && cost >= 0 && this.balance >= cost;
  }

  getTransactions(): FinanceTransaction[] {
    return this.transactions.map((transaction) => ({ ...transaction }));
  }

  applyTransaction(amount: number, description: string, occurredAt: string): boolean {
    if (!Number.isFinite(amount) || description.trim().length === 0 || occurredAt.length === 0) {
      return false;
    }

    const balanceAfter = this.balance + amount;

    if (!isValidBalance(balanceAfter)) {
      return false;
    }

    this.balance = balanceAfter;
    this.transactions.push({ amount, description, balanceAfter, occurredAt });
    return true;
  }

  clone(): Finance {
    return Finance.fromSnapshot(this.toSnapshot());
  }

  toSnapshot(): FinanceSnapshot {
    return {
      balance: this.balance,
      transactions: this.getTransactions(),
    };
  }

  static fromSnapshot(snapshot: FinanceSnapshot): Finance {
    return new Finance(snapshot);
  }

  private restore(snapshot: FinanceSnapshot): void {
    this.balance = isValidBalance(snapshot.balance) ? snapshot.balance : FINANCE_INITIAL_BALANCE;
    this.transactions = snapshot.transactions
      .filter((transaction) => (
        Number.isFinite(transaction.amount)
        && isValidBalance(transaction.balanceAfter)
        && transaction.description.trim().length > 0
        && transaction.occurredAt.length > 0
      ))
      .map((transaction) => ({ ...transaction }));
  }
}
