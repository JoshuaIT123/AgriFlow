import { db } from "../db";
import { toPublicUser } from "../db/users";
import type { Offer, Product, Trade } from "../types";

/** Product enriched with its owning farmer, so listings can show a seller. */
export async function productView(product: Product) {
  return { ...product, farmer: await userSummary(product.farmerId) };
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
  const [productS, buyerS, farmerS] = await Promise.all([
    productSummary(offer.productId),
    userSummary(offer.buyerId),
    product ? userSummary(product.farmerId) : Promise.resolve(null),
  ]);
  return {
    ...offer,
    product: productS,
    buyer: buyerS,
    farmer: farmerS,
  };
}

/** Trade enriched with product, counterparts and latest payment. */
export async function tradeView(trade: Trade) {
  const payments = await db.payments.findByTrade(trade.id);
  const payment = payments[0];
  const [productS, buyerS, farmerS] = await Promise.all([
    productSummary(trade.productId),
    userSummary(trade.buyerId),
    userSummary(trade.farmerId),
  ]);
  return {
    ...trade,
    product: productS,
    buyer: buyerS,
    farmer: farmerS,
    payment: payment ?? null,
  };
}
