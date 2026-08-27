import { db } from "../db";
import { toPublicUser } from "../db/users";
import type { Offer, Product, Trade } from "../types";

export function productView(product: Product) {
  return { ...product };
}

async function productSummary(productId: string) {
  const p = await db.products.findById(productId);
  return p
    ? {
        id: p.id,
        name: p.name,
        unit: p.unit,
        price: p.price,
        location: p.location,
        quality: p.quality,
        status: p.status,
      }
    : null;
}

async function userSummary(userId: string) {
  const u = await db.users.findById(userId);
  return u ? toPublicUser(u) : null;
}

/** Offer enriched with its product + buyer + owner farmer (for the UI). */
export async function offerView(offer: Offer) {
  const product = await db.products.findById(offer.productId);
  return {
    ...offer,
    product: await productSummary(offer.productId),
    buyer: await userSummary(offer.buyerId),
    farmer: product ? await userSummary(product.farmerId) : null,
  };
}

/** Trade enriched with product, counterparts and latest payment. */
export async function tradeView(trade: Trade) {
  const [payment] = await db.payments.findByTrade(trade.id);
  return {
    ...trade,
    product: await productSummary(trade.productId),
    buyer: await userSummary(trade.buyerId),
    farmer: await userSummary(trade.farmerId),
    payment: payment ?? null,
  };
}

/** Convenience: map a list of trades to views concurrently. */
export async function tradeViews(trades: Trade[]) {
  return Promise.all(trades.map(tradeView));
}

/** Convenience: map a list of offers to views concurrently. */
export async function offerViews(offers: Offer[]) {
  return Promise.all(offers.map(offerView));
}