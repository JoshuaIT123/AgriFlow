import type { Offer } from "../types";

/** In-memory Offer repository (swappable for Person 4's DB layer). */
export class OfferRepository {
  private items = new Map<string, Offer>();

  create(input: Offer): Offer {
    this.items.set(input.id, input);
    return input;
  }

  update(id: string, patch: Partial<Offer>): Offer | undefined {
    const existing = this.items.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch };
    this.items.set(id, updated);
    return updated;
  }

  findById(id: string): Offer | undefined {
    return this.items.get(id);
  }

  listByBuyer(buyerId: string): Offer[] {
    return Array.from(this.items.values())
      .filter((o) => o.buyerId === buyerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /** Offers received for a farmer's set of product ids. */
  listForProducts(productIds: readonly string[]): Offer[] {
    const ids = new Set(productIds);
    return Array.from(this.items.values())
      .filter((o) => ids.has(o.productId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}