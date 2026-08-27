import { prisma } from "../prisma";
import { UserRepository } from "./users";
import { ProductRepository } from "./products";
import { OfferRepository } from "./offers";
import { TradeRepository } from "./trades";
import { PaymentRepository } from "./payments";

/**
 * Central data access, backed by PostgreSQL (Neon) through Prisma.
 * Each repository maps rows to the entity shapes used by route handlers,
 * so swapping or extending queries does not touch the API layer.
 */
export const db = {
  users: new UserRepository(),
  products: new ProductRepository(),
  offers: new OfferRepository(),
  trades: new TradeRepository(),
  payments: new PaymentRepository(),
};

/** Empties all tables (used by db:reset and integration tests). */
export async function resetDb(): Promise<void> {
  // Delete children before parents so foreign keys stay satisfied.
  await prisma.$transaction([
    prisma.payment.deleteMany(),
    prisma.tradeStatusEntry.deleteMany(),
    prisma.trade.deleteMany(),
    prisma.offer.deleteMany(),
    prisma.product.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}