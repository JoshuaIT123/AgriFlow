import { prisma } from "../prisma";
import type { Trade, TradeStatusEntry } from "../types";

export class TradeRepository {
  async create(input: Omit<Trade, "createdAt" | "updatedAt">): Promise<Trade> {
    const t = await prisma.trade.create({
      data: {
        id: input.id,
        offerId: input.offerId,
        buyerId: input.buyerId,
        farmerId: input.farmerId,
        productId: input.productId,
        quantity: input.quantity,
        agreedPrice: input.agreedPrice,
        totalAmount: input.totalAmount,
        status: input.status,
        statusHistory: {
          create: input.statusHistory.map((h) => ({ status: h.status, at: new Date(h.at) })),
        },
      },
      include: { statusHistory: true },
    });
    return this.toTrade(t);
  }

  async update(id: string, patch: Partial<Trade>): Promise<Trade | undefined> {
    try {
      const { statusHistory, ...rest } = patch;
      const t = await prisma.trade.update({
        where: { id },
        data: {
          ...rest,
          ...(statusHistory
            ? {
                statusHistory: {
                  create: statusHistory.map((h: TradeStatusEntry) => ({
                    status: h.status,
                    at: new Date(h.at),
                  })),
                },
              }
            : {}),
        },
        include: { statusHistory: true },
      });
      return this.toTrade(t);
    } catch {
      return undefined;
    }
  }

  async findById(id: string): Promise<Trade | undefined> {
    const t = await prisma.trade.findUnique({ where: { id }, include: { statusHistory: true } });
    return t ? this.toTrade(t) : undefined;
  }

  async listForUser(userId: string): Promise<Trade[]> {
    const items = await prisma.trade.findMany({
      where: { OR: [{ buyerId: userId }, { farmerId: userId }] },
      orderBy: { createdAt: "desc" },
      include: { statusHistory: true },
    });
    return items.map(this.toTrade);
  }

  async listByFarmer(farmerId: string): Promise<Trade[]> {
    const items = await prisma.trade.findMany({
      where: { farmerId },
      orderBy: { createdAt: "desc" },
      include: { statusHistory: true },
    });
    return items.map(this.toTrade);
  }

  async listByBuyer(buyerId: string): Promise<Trade[]> {
    const items = await prisma.trade.findMany({
      where: { buyerId },
      orderBy: { createdAt: "desc" },
      include: { statusHistory: true },
    });
    return items.map(this.toTrade);
  }

  private toTrade(t: any): Trade {
    return {
      id: t.id,
      offerId: t.offerId,
      buyerId: t.buyerId,
      farmerId: t.farmerId,
      productId: t.productId,
      quantity: t.quantity,
      agreedPrice: t.agreedPrice,
      totalAmount: t.totalAmount,
      status: t.status,
      statusHistory: (t.statusHistory ?? []).map((h: any) => ({
        status: h.status,
        at: h.at.toISOString(),
      })),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  }
}
