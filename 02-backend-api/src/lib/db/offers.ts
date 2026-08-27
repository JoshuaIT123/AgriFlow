import { prisma } from "../prisma";
import type { Offer } from "../types";

export class OfferRepository {
  async create(input: Omit<Offer, "createdAt">): Promise<Offer> {
    const o = await prisma.offer.create({
      data: {
        id: input.id,
        buyerId: input.buyerId,
        productId: input.productId,
        quantity: input.quantity,
        price: input.price,
        totalAmount: input.totalAmount,
        status: input.status,
      },
    });
    return this.toOffer(o);
  }

  async update(id: string, patch: Partial<Offer>): Promise<Offer | undefined> {
    try {
      const o = await prisma.offer.update({ where: { id }, data: patch });
      return this.toOffer(o);
    } catch {
      return undefined;
    }
  }

  async findById(id: string): Promise<Offer | undefined> {
    const o = await prisma.offer.findUnique({ where: { id } });
    return o ? this.toOffer(o) : undefined;
  }

  async listByBuyer(buyerId: string): Promise<Offer[]> {
    const items = await prisma.offer.findMany({
      where: { buyerId },
      orderBy: { createdAt: "desc" },
    });
    return items.map(this.toOffer);
  }

  async listForProducts(productIds: readonly string[]): Promise<Offer[]> {
    const items = await prisma.offer.findMany({
      where: { productId: { in: [...productIds] } },
      orderBy: { createdAt: "desc" },
    });
    return items.map(this.toOffer);
  }

  private toOffer(o: any): Offer {
    return {
      id: o.id,
      buyerId: o.buyerId,
      productId: o.productId,
      quantity: o.quantity,
      price: o.price,
      totalAmount: o.totalAmount,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    };
  }
}
