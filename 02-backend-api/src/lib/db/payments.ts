import type { Payment } from "../types";

/** In-memory Payment repository (swappable for Person 4's DB layer). */
export class PaymentRepository {
  private items = new Map<string, Payment>();

  create(input: Payment): Payment {
    this.items.set(input.id, input);
    return input;
  }

  update(id: string, patch: Partial<Payment>): Payment | undefined {
    const existing = this.items.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch };
    this.items.set(id, updated);
    return updated;
  }

  findById(id: string): Payment | undefined {
    return this.items.get(id);
  }

  /** Payments for a trade, latest first. */
  findByTrade(tradeId: string): Payment[] {
    return Array.from(this.items.values())
      .filter((p) => p.tradeId === tradeId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}