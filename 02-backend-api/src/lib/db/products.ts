import type { Product } from "../types";

/** In-memory Product repository (swappable for Person 4's DB layer). */
export class ProductRepository {
  private items = new Map<string, Product>();

  create(input: Product): Product {
    this.items.set(input.id, input);
    return input;
  }

  update(id: string, patch: Partial<Product>): Product | undefined {
    const existing = this.items.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch };
    this.items.set(id, updated);
    return updated;
  }

  findById(id: string): Product | undefined {
    return this.items.get(id);
  }

  listActive(): Product[] {
    return Array.from(this.items.values())
      .filter((p) => p.status === "ACTIVE")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  listByFarmer(farmerId: string): Product[] {
    return Array.from(this.items.values())
      .filter((p) => p.farmerId === farmerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}