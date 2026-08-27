import { prisma } from "../prisma";
import type { Payment } from "../types";

export class PaymentRepository {
  async create(input: Omit<Payment, "createdAt">): Promise<Payment> {
    const p = await prisma.payment.create({
      data: {
        id: input.id,
        tradeId: input.tradeId,
        paymentRequest: input.paymentRequest,
        paymentHash: input.paymentHash,
        amountMsat: BigInt(input.amountMsat),
        status: input.status,
        paidAt: input.paidAt ? new Date(input.paidAt) : undefined,
        settledAt: input.settledAt ? new Date(input.settledAt) : undefined,
      },
    });
    return this.toPayment(p);
  }

  async update(id: string, patch: Partial<Payment>): Promise<Payment | undefined> {
    try {
      const { amountMsat, paidAt, settledAt, ...rest } = patch as any;
      const p = await prisma.payment.update({
        where: { id },
        data: {
          ...rest,
          ...(amountMsat !== undefined ? { amountMsat: BigInt(amountMsat) } : {}),
          ...(paidAt !== undefined ? { paidAt: paidAt ? new Date(paidAt) : null } : {}),
          ...(settledAt !== undefined ? { settledAt: settledAt ? new Date(settledAt) : null } : {}),
        },
      });
      return this.toPayment(p);
    } catch {
      return undefined;
    }
  }

  async findById(id: string): Promise<Payment | undefined> {
    const p = await prisma.payment.findUnique({ where: { id } });
    return p ? this.toPayment(p) : undefined;
  }

  async findByTrade(tradeId: string): Promise<Payment[]> {
    const items = await prisma.payment.findMany({
      where: { tradeId },
      orderBy: { createdAt: "desc" },
    });
    return items.map(this.toPayment);
  }

  private toPayment(p: any): Payment {
    return {
      id: p.id,
      tradeId: p.tradeId,
      paymentRequest: p.paymentRequest,
      paymentHash: p.paymentHash,
      amountMsat: Number(p.amountMsat),
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      paidAt: p.paidAt ? p.paidAt.toISOString() : undefined,
      settledAt: p.settledAt ? p.settledAt.toISOString() : undefined,
    };
  }
}
