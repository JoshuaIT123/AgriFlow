"use client";

import { bumpStore } from "./store-bus";
import {
  apiListProducts,
  apiListTrades,
  apiMyOffers,
  apiReceivedOffers,
  type ApiOffer,
  type ApiProduct,
  type ApiTrade,
} from "./api";
import type { Deal, Offer, Product, Unit } from "./types";

/*
 * Remote cache.
 *
 * The pages read their data synchronously (via store.ts) and re-render when
 * store-bus bumps. Rather than rewrite every page into an async data-fetching
 * component, we keep that contract and hold the server state in a module-level
 * cache: hydrate() pulls from the backend, maps into the UI types, then bumps
 * the bus so every mounted page re-reads.
 *
 * Vocabulary mapping (backend -> UI):
 *   name -> title, quantity -> quantityKg, price -> pricePerKg,
 *   quality -> category, ACTIVE/DEACTIVATED -> available/sold.
 */

interface Cache {
  products: Product[];
  offers: Offer[];
  deals: Deal[];
  loaded: boolean;
}

const cache: Cache = { products: [], offers: [], deals: [], loaded: false };

export function isLoaded(): boolean {
  return cache.loaded;
}

export function cachedProducts(): Product[] {
  return cache.products;
}

export function cachedOffers(): Offer[] {
  return cache.offers;
}

export function cachedDeals(): Deal[] {
  return cache.deals;
}

export function clearCache() {
  cache.products = [];
  cache.offers = [];
  cache.deals = [];
  cache.loaded = false;
  bumpStore();
}

function toUnit(unit: string | undefined): Unit {
  const allowed: Unit[] = ["kg", "head", "litre", "unit", "crate", "dozen", "bunch"];
  return allowed.includes(unit as Unit) ? (unit as Unit) : "kg";
}

export function mapProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    farmerId: p.farmerId,
    farmerName: p.farmer?.name ?? "Farmer",
    title: p.name,
    // The backend has no category column; the UI's category rides in `quality`.
    category: p.quality || "Other",
    quantityKg: p.quantity,
    pricePerKg: p.price,
    unit: toUnit(p.unit),
    currency: "RWF",
    status: p.status === "ACTIVE" ? "available" : "sold",
    createdAt: p.createdAt,
  };
}

export function mapOffer(o: ApiOffer): Offer {
  return {
    id: o.id,
    productId: o.productId,
    buyerId: o.buyerId,
    buyerName: o.buyer?.name ?? "Buyer",
    pricePerKg: o.price,
    quantityKg: o.quantity,
    unit: toUnit(o.product?.unit),
    currency: "RWF",
    status:
      o.status === "PENDING"
        ? "pending"
        : o.status === "ACCEPTED"
          ? "accepted"
          : "rejected",
    createdAt: o.createdAt,
  };
}

/*
 * The backend trade machine has eight states; the UI's Deal has four. Anything
 * at or past DELIVERED reads as confirmed, everything else as awaiting
 * delivery, which is the distinction the payment screens actually draw.
 */
export function mapTrade(t: ApiTrade): Deal {
  const done = t.status === "DELIVERED" || t.status === "SETTLED";
  return {
    id: t.id,
    productId: t.productId,
    offerId: t.offerId,
    farmerId: t.farmerId,
    farmerName: t.farmer?.name ?? "Farmer",
    buyerId: t.buyerId,
    buyerName: t.buyer?.name ?? "Buyer",
    productTitle: t.product?.name ?? "Product",
    quantityKg: t.quantity,
    unit: toUnit(t.product?.unit),
    amountRwf: t.totalAmount,
    currency: "RWF",
    status: done ? "confirmed" : "pending_delivery",
    autoReleaseInHours: 72,
    createdAt: t.createdAt,
    confirmedAt: done ? t.updatedAt : null,
    releasedAt: t.status === "SETTLED" ? t.updatedAt : null,
    hasConditionalSettlement: true,
    tradeStatus: t.status,
  };
}

/**
 * Pulls the current user's server state into the cache.
 *
 * Offers differ by role (a farmer sees offers received, a buyer sees their
 * own), so the caller passes the role. Failures leave the previous cache in
 * place rather than blanking the UI mid-demo.
 */
let lastRole: "farmer" | "buyer" = "buyer";

/** Re-pulls using the role of the last hydrate; used after a mutation. */
export function refresh(): Promise<void> {
  return hydrate(lastRole);
}

export async function hydrate(role: "farmer" | "buyer"): Promise<void> {
  lastRole = role;
  try {
    const [products, offers, trades] = await Promise.all([
      apiListProducts().then((r) => r.products),
      (role === "farmer" ? apiReceivedOffers() : apiMyOffers()).then((r) => r.offers),
      apiListTrades().then((r) => r.trades),
    ]);
    cache.products = products.map(mapProduct);
    cache.offers = offers.map(mapOffer);
    cache.deals = trades.map(mapTrade);
    cache.loaded = true;
  } catch {
    // Keep whatever we already had; the page shows its empty state instead.
    cache.loaded = true;
  }
  bumpStore();
}
