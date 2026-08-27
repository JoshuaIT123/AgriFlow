import { prisma } from "../prisma";
import type { Product } from "../types";

export class ProductRepository {
  async create(input: Omit<Product, "createdAt">): Promise<Product> {
    const p = await prisma.product.create({
      data: {
        id: input.id,
        farmerId: input.farmerId,
        name: input.name,
        quantity: input.quantity,
        unit: input.unit,
        price: input.price,
        location: input.location,
        quality: input.quality,
        status: input.status,
      },
    });
    return this.toProduct(p);
  }

  async update(id: string, patch: Partial<Product>): Promise<Product | undefined> {
    try {
      const p = await prisma.product.update({ where: { id }, data: patch });
      return this.toProduct(p);
    } catch {
      return undefined;
    }
  }

  async findById(id: string): Promise<Product | undefined> {
    const p = await prisma.product.findUnique({ where: { id } });
    return p ? this.toProduct(p) : undefined;
  }

  async listActive(): Promise<Product[]> {
    const items = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });
    return items.map(this.toProduct);
  }

  async listByFarmer(farmerId: string): Promise<Product[]> {
    const items = await prisma.product.findMany({
      where: { farmerId },
      orderBy: { createdAt: "desc" },
    });
    return items.map(this.toProduct);
  }

  private toProduct(p: any): Product {
    return {
      id: p.id,
      farmerId: p.farmerId,
      name: p.name,
      quantity: p.quantity,
      unit: p.unit,
      price: p.price,
      location: p.location,
      quality: p.quality,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
    };
  }
}
