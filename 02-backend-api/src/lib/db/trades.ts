import type { Trade } from "../types";

/** In-memory Trade repository (swappable for Person 4's DB layer). */
export class TradeRepository {
  private items = new Map<string, Trade>();

  create(input: Trade): Trade {
    this.items.set(input.id, input);
    return input;
  }

  update(id: string, patch: Partial<Trade>): Trade | undefined {
    const existing = this.items.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch };
    this.items.set(id, updated);
    return updated;
  }

  findById(id: string): Trade | undefined {
    return this.items.get(id);
  }

  listForUser(userId: string): Trade[] {
    return Array.from(this.items.values())
      .filter((t) => t.buyerId === userId || t.farmerId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  listByFarmer(farmerId: string): Trade[] {
    return Array.from(this.items.values())
      .filter((t) => t.farmerId === farmerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  listByBuyer(buyerId: string): Trade[] {
    return Array.from(this.items.values())
      .filter((t) => t.buyerId === buyerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}