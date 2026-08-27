import { UserRepository } from "./users";
import { ProductRepository } from "./products";
import { OfferRepository } from "./offers";
import { TradeRepository } from "./trades";
import { PaymentRepository } from "./payments";

/**
 * Central application data access.
 * Repositories are singletons per-process. In a real DB world these would
 * wrap connection pools / query builders from the Database team (Person 4).
 */
export const db = {
  users: new UserRepository(),
  products: new ProductRepository(),
  offers: new OfferRepository(),
  trades: new TradeRepository(),
  payments: new PaymentRepository(),
};

/** Resets all repositories (used for tests / seeding a fresh demo). */
export function resetDb(): void {
  db.users = new UserRepository();
  db.products = new ProductRepository();
  db.offers = new OfferRepository();
  db.trades = new TradeRepository();
  db.payments = new PaymentRepository();
}