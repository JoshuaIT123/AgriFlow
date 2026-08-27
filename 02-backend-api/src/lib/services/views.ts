import { db } from "../db";
import { toPublicUser } from "../db/users";
import type { Offer, Product, Trade } from "../types";

export function productView(product: Product) {
  return { ...product };
}

function productSummary(productId: string) {
  const p = db.products.findById(productId);
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

function userSummary(userId: string) {
  const u = db.users.findById(userId);
  return u ? toPublicUser(u) : null;
}

/** Offer enriched with its product + buyer + owner farmer (for the UI). */
export function offerView(offer: Offer) {
  const product = db.products.findById(offer.productId);
  return {
    ...offer,
    product: productSummary(offer.productId),
    buyer: userSummary(offer.buyerId),
    farmer: product ? userSummary(product.farmerId) : null,
  };
}

/** Trade enriched with product, counterparts and latest payment. */
export function tradeView(trade: Trade) {
  const [payment] = db.payments.findByTrade(trade.id);
  return {
    ...trade,
    product: productSummary(trade.productId),
    buyer: userSummary(trade.buyerId),
    farmer: userSummary(trade.farmerId),
    payment: payment ?? null,
  };
}