import { bumpStore } from "./store-bus";
import {
  ApiError,
  apiAcceptOffer,
  apiBuyNow,
  apiConfirmDelivery,
  apiCreateOffer,
  apiCreateProduct,
  apiRejectOffer,
  apiSetProductStatus,
} from "./api";
import { cachedDeals, cachedOffers, cachedProducts, mapTrade, refresh } from "./remote";
import type {
  Account,
  BuyerArrangement,
  Deal,
  Locale,
  Offer,
  OfferStatus,
  Product,
  Role,
  Unit,
  WalletTxn,
} from "./types";

const LS = {
  accounts: "agriflow.accounts.v2",
  session: "agriflow.session.v2",
  data: "agriflow.data.v2",
  schema: "agriflow.schema.v2",
} as const;

const SCHEMA_VERSION = 1;

export interface StoredAccount extends Account {
  passwordHash: string; // demo hash only — never a real credential
}

/*
 * Products, offers and trades live on the backend (see remote.ts). Only the
 * wallet and recurring arrangements remain local: the API has no model for
 * either yet, so they stay client-side rather than being silently dropped.
 */
interface Data {
  walletTxns: WalletTxn[];
  arrangements: BuyerArrangement[];
}

const EMPTY: Data = {
  walletTxns: [],
  arrangements: [],
};

/*
 * Guard against stale localStorage left by older app versions. If the stored
 * schema marker doesn't match the current one, we wipe the demo state so the
 * UI never chokes on malformed/outdated data (a common cause of "hang loading").
 */
let schemaChecked = false;
function ensureSchema() {
  if (typeof window === "undefined" || schemaChecked) return;
  schemaChecked = true;
  try {
    if (window.localStorage.getItem(LS.schema) !== String(SCHEMA_VERSION)) {
      window.localStorage.removeItem(LS.session);
      window.localStorage.setItem(LS.schema, String(SCHEMA_VERSION));
    }
  } catch {
    // non-fatal for demo
  }
}

function readData(): Data {
  if (typeof window === "undefined") return EMPTY;
  ensureSchema();
  try {
    const raw = window.localStorage.getItem(LS.data);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw) as Partial<Data>;
    return {
      walletTxns: Array.isArray(p.walletTxns) ? p.walletTxns : [],
      arrangements: Array.isArray(p.arrangements) ? p.arrangements : [],
    };
  } catch {
    return EMPTY;
  }
}

function writeData(data: Data) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS.data, JSON.stringify(data));
  } catch {
    // non-fatal for demo
  }
  bumpStore();
}

/* ---------------- Accounts & session ---------------- */

export function readSession(): string | null {
  if (typeof window === "undefined") return null;
  ensureSchema();
  try {
    return window.localStorage.getItem(LS.session);
  } catch {
    return null;
  }
}

export function writeSession(id: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (id) window.localStorage.setItem(LS.session, id);
    else window.localStorage.removeItem(LS.session);
  } catch {
    // non-fatal
  }
}

function readAccounts(): StoredAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS.accounts);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredAccount[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAccounts(list: StoredAccount[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS.accounts, JSON.stringify(list));
  } catch {
    // non-fatal
  }
}

/* Demo-only local hash. Real systems MUST hash on the server. */
function hashPassword(input: string): string {
  let h = 5381;
  const salted = "agriflow:" + input;
  for (let i = 0; i < salted.length; i++) {
    h = (h * 33) ^ salted.charCodeAt(i);
  }
  return "h" + (h >>> 0).toString(16);
}

export function findAccountByPhone(phone: string): StoredAccount | undefined {
  return readAccounts().find((a) => a.phone === normalizePhone(phone));
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, "");
}

export function createAccount(input: {
  name: string;
  phone: string;
  password: string;
  mobileMoney: string;
  role: Role;
  locale: Locale;
}): StoredAccount {
  const account: StoredAccount = {
    id: uid(),
    name: input.name.trim(),
    phone: normalizePhone(input.phone),
    mobileMoney: input.mobileMoney,
    role: input.role,
    locale: input.locale,
    passwordHash: hashPassword(input.password),
    createdAt: new Date().toISOString(),
  };
  const accounts = readAccounts();
  accounts.push(account);
  writeAccounts(accounts);
  return account;
}

export function verifyLogin(
  phone: string,
  password: string
): StoredAccount | null {
  const account = findAccountByPhone(phone);
  if (account && account.passwordHash === hashPassword(password)) {
    return account;
  }
  return null;
}

export function getAccount(id: string | null): StoredAccount | null {
  if (!id) return null;
  return readAccounts().find((a) => a.id === id) ?? null;
}

/* ---------------- Accessors (read-only slices) ---------------- */

/*
 * These read the remote cache filled by remote.hydrate(). They stay
 * synchronous so the existing pages keep working unchanged: a page reads its
 * slice, and re-reads when store-bus bumps after a hydrate or a mutation.
 */

export function getProducts(farmerId?: string): Product[] {
  const list = cachedProducts();
  const filtered = farmerId ? list.filter((p) => p.farmerId === farmerId) : list;
  return [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getAvailableProducts(): Product[] {
  return cachedProducts()
    .filter((p) => p.status === "available")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getProduct(id: string): Product | undefined {
  return cachedProducts().find((p) => p.id === id);
}

export function getOffersForProduct(productId: string): Offer[] {
  return cachedOffers()
    .filter((o) => o.productId === productId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** The backend already scopes /api/offers/received to the caller's products. */
export function getOffersReceivedByFarmer(_farmerId: string): Offer[] {
  return [...cachedOffers()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** The backend already scopes /api/offers/my to the calling buyer. */
export function getMyOffers(_buyerId: string): Offer[] {
  return [...cachedOffers()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getDealsForFarmer(farmerId: string): Deal[] {
  return cachedDeals()
    .filter((d) => d.farmerId === farmerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getDealsForBuyer(buyerId: string): Deal[] {
  return cachedDeals()
    .filter((d) => d.buyerId === buyerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ---------------- Wallet ---------------- */

export function getWalletTxns(accountId: string): WalletTxn[] {
  return readData()
    .walletTxns.filter((w) => w.accountId === accountId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function walletBalance(accountId: string): number {
  return readData()
    .walletTxns.filter((w) => w.accountId === accountId)
    .filter((w) => w.status === "settled")
    .reduce((sum, w) => sum + (w.kind === "credit" ? w.amount : -w.amount), 0);
}

export function walletHeld(accountId: string): number {
  return readData()
    .walletTxns.filter((w) => w.accountId === accountId && w.status === "pending")
    .reduce((sum, w) => sum + (w.kind === "credit" ? w.amount : -w.amount), 0);
}

export function simulateWalletTopUp(accountId: string, amount: number) {
  const data = readData();
  data.walletTxns.push({
    id: uid(),
    accountId,
    kind: "credit",
    amount,
    currency: "RWF",
    status: "settled",
    note: "top_up",
    createdAt: new Date().toISOString(),
  });
  writeData(data);
}

/* ---------------- Product / Offer / Deal mutations ---------------- */

/*
 * Mutations go straight to the backend and then refresh the cache, so what
 * the UI shows after an action is what the database actually stored rather
 * than an optimistic guess.
 */

export async function createProduct(input: {
  farmerId: string;
  farmerName: string;
  title: string;
  category: string;
  quantityKg: number;
  pricePerKg: number;
  unit?: Unit;
  location?: string;
}): Promise<boolean> {
  try {
    await apiCreateProduct({
      name: input.title.trim(),
      quantity: input.quantityKg,
      unit: input.unit || "kg",
      price: input.pricePerKg,
      // Location is required by the API; fall back to the seller's name so a
      // listing is never rejected for a field the form does not collect.
      location: input.location?.trim() || input.farmerName,
      quality: input.category.trim(),
    });
    await refresh();
    return true;
  } catch {
    return false;
  }
}

export async function setProductStatus(
  productId: string,
  status: Product["status"],
): Promise<boolean> {
  try {
    await apiSetProductStatus(productId, status === "available" ? "ACTIVE" : "DEACTIVATED");
    await refresh();
    return true;
  } catch {
    return false;
  }
}

/**
 * Buy at the asking price. Returns the opened trade as a Deal so the caller
 * can hand it straight to the payment dialog.
 */
export async function buyNow(
  productId: string,
  quantity: number,
): Promise<Deal | null> {
  try {
    const res = await apiBuyNow(productId, quantity);
    await refresh();
    return mapTrade(res.trade);
  } catch {
    return null;
  }
}

/**
 * Places an offer. An offer at or above the asking price is accepted by the
 * backend immediately, which returns the opened trade - the caller can send
 * that straight to payment instead of waiting on the farmer.
 */
export async function placeOffer(input: {
  productId: string;
  buyerId: string;
  buyerName: string;
  pricePerKg: number;
  quantityKg: number;
  message?: string;
}): Promise<{ ok: boolean; deal: Deal | null }> {
  try {
    // The backend computes the total; it never trusts a client-sent amount.
    const res = await apiCreateOffer({
      productId: input.productId,
      quantity: input.quantityKg,
      price: input.pricePerKg,
    });
    await refresh();
    return { ok: true, deal: res.trade ? mapTrade(res.trade) : null };
  } catch {
    return { ok: false, deal: null };
  }
}

/** The trade opened from a given offer, when one exists. */
export function getDealForOffer(offerId: string): Deal | undefined {
  return cachedDeals().find((d) => d.offerId === offerId);
}

export async function respondToOffer(
  offerId: string,
  response: Extract<OfferStatus, "accepted" | "rejected">,
): Promise<"ok" | "not_found" | "already_responded"> {
  try {
    if (response === "accepted") await apiAcceptOffer(offerId);
    else await apiRejectOffer(offerId);
    await refresh();
    return "ok";
  } catch (err) {
    // 409 means the farmer already answered this offer elsewhere.
    if (err instanceof ApiError && err.status === 409) return "already_responded";
    return "not_found";
  }
}

export async function confirmDelivery(dealId: string): Promise<boolean> {
  try {
    await apiConfirmDelivery(dealId);
    await refresh();
    return true;
  } catch {
    return false;
  }
}

/* ---------------- Recurring arrangements ---------------- */

export function getArrangements(farmerId: string): BuyerArrangement[] {
  return readData()
    .arrangements.filter((a) => a.farmerId === farmerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createArrangement(input: {
  farmerId: string;
  buyer: string;
  item: string;
  pricePerKg: number;
  cadence: "monthly" | "seasonal";
}): BuyerArrangement {
  const arrangement: BuyerArrangement = {
    id: uid(),
    farmerId: input.farmerId,
    buyer: input.buyer.trim(),
    item: input.item.trim(),
    pricePerKg: input.pricePerKg,
    currency: "RWF",
    cadence: input.cadence,
    status: "active",
    createdAt: new Date().toISOString(),
    nextCycle: nextCycleDate(input.cadence).toISOString(),
    totalCycles: input.cadence === "monthly" ? 12 : 4,
    completedCycles: 0,
  };
  const data = readData();
  data.arrangements.push(arrangement);
  writeData(data);
  return arrangement;
}

export function setArrangementStatus(
  id: string,
  status: BuyerArrangement["status"]
): boolean {
  const data = readData();
  const arr = data.arrangements.find((a) => a.id === id);
  if (!arr) return false;
  arr.status = status;
  writeData(data);
  return true;
}

function nextCycleDate(cadence: "monthly" | "seasonal"): Date {
  const now = new Date();
  if (cadence === "monthly") now.setMonth(now.getMonth() + 1);
  else now.setMonth(now.getMonth() + 3);
  return now;
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
