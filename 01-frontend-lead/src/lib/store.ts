import { bumpStore } from "./store-bus";
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

interface Data {
  products: Product[];
  offers: Offer[];
  deals: Deal[];
  walletTxns: WalletTxn[];
  arrangements: BuyerArrangement[];
}

const EMPTY: Data = {
  products: [],
  offers: [],
  deals: [],
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
      products: Array.isArray(p.products) ? p.products : [],
      offers: Array.isArray(p.offers) ? p.offers : [],
      deals: Array.isArray(p.deals) ? p.deals : [],
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
  seedForNewAccount(account);
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

export function getProducts(farmerId?: string): Product[] {
  const list = readData().products;
  const filtered = farmerId ? list.filter((p) => p.farmerId === farmerId) : list;
  return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getAvailableProducts(): Product[] {
  return readData()
    .products.filter((p) => p.status === "available")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getProduct(id: string): Product | undefined {
  return readData().products.find((p) => p.id === id);
}

export function getOffersForProduct(productId: string): Offer[] {
  return readData()
    .offers.filter((o) => o.productId === productId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getOffersReceivedByFarmer(farmerId: string): Offer[] {
  const myProductIds = new Set(
    readData()
      .products.filter((p) => p.farmerId === farmerId)
      .map((p) => p.id)
  );
  return readData()
    .offers.filter((o) => myProductIds.has(o.productId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getMyOffers(buyerId: string): Offer[] {
  return readData()
    .offers.filter((o) => o.buyerId === buyerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getDealsForFarmer(farmerId: string): Deal[] {
  return readData()
    .deals.filter((d) => d.farmerId === farmerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getDealsForBuyer(buyerId: string): Deal[] {
  return readData()
    .deals.filter((d) => d.buyerId === buyerId)
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

export function createProduct(input: {
  farmerId: string;
  farmerName: string;
  title: string;
  category: string;
  quantityKg: number;
  pricePerKg: number;
  unit?: Unit;
}): Product {
  const product: Product = {
    id: uid(),
    farmerId: input.farmerId,
    farmerName: input.farmerName,
    title: input.title.trim(),
    category: input.category.trim(),
    quantityKg: input.quantityKg,
    pricePerKg: input.pricePerKg,
    unit: input.unit || "kg",
    currency: "RWF",
    status: "available",
    createdAt: new Date().toISOString(),
  };
  const data = readData();
  data.products.push(product);
  writeData(data);
  return product;
}

export function setProductStatus(
  productId: string,
  status: Product["status"]
): boolean {
  const data = readData();
  const p = data.products.find((x) => x.id === productId);
  if (!p) return false;
  p.status = status;
  writeData(data);
  return true;
}

export function placeOffer(input: {
  productId: string;
  buyerId: string;
  buyerName: string;
  pricePerKg: number;
  quantityKg: number;
  message?: string;
}): boolean {
  const data = readData();
  const product = data.products.find((p) => p.id === input.productId);
  if (!product || product.status !== "available") return false;
  const existing = data.offers.find(
    (o) =>
      o.productId === input.productId &&
      o.buyerId === input.buyerId &&
      o.status === "pending"
  );
  if (existing) return false; // one pending offer per buyer per product
  data.offers.push({
    id: uid(),
    productId: input.productId,
    buyerId: input.buyerId,
    buyerName: input.buyerName,
    pricePerKg: input.pricePerKg,
    quantityKg: input.quantityKg,
    unit: product.unit || "kg",
    currency: "RWF",
    message: input.message?.trim() || undefined,
    status: "pending",
    createdAt: new Date().toISOString(),
  });
  writeData(data);
  return true;
}

export function respondToOffer(
  offerId: string,
  response: Extract<OfferStatus, "accepted" | "rejected">
): "ok" | "not_found" | "already_responded" {
  const data = readData();
  const offer = data.offers.find((o) => o.id === offerId);
  if (!offer) return "not_found";
  if (offer.status !== "pending") return "already_responded";
  offer.status = response;

  if (response === "accepted") {
    const product = data.products.find((p) => p.id === offer.productId);
    if (product) product.status = "sold";
    const amount = offer.quantityKg * offer.pricePerKg;
    const now = new Date().toISOString();
    const deal: Deal = {
      id: uid(),
      productId: offer.productId,
      offerId: offer.id,
      farmerId: product?.farmerId ?? "",
      farmerName: product?.farmerName ?? "",
      buyerId: offer.buyerId,
      buyerName: offer.buyerName,
      productTitle: product?.title ?? "Product",
      quantityKg: offer.quantityKg,
      unit: offer.unit || "kg",
      amountRwf: amount,
      currency: "RWF",
      status: "pending_delivery",
      autoReleaseInHours: 72,
      createdAt: now,
      confirmedAt: null,
      releasedAt: null,
      hasConditionalSettlement: true,
    };
    // Escrow: buyer's amount is held (pending debit), not yet settled.
    data.deals.push(deal);
    if (product) {
      data.walletTxns.push({
        id: uid(),
        accountId: offer.buyerId,
        kind: "debit",
        amount,
        currency: "RWF",
        status: "pending",
        note: `escrow:${deal.id}`,
        createdAt: now,
      });
    }
  }

  writeData(data);
  return "ok";
}

export function confirmDelivery(dealId: string): boolean {
  const data = readData();
  const deal = data.deals.find((d) => d.id === dealId);
  if (!deal || deal.status !== "pending_delivery") return false;
  deal.status = "confirmed";
  const now = new Date().toISOString();
  deal.confirmedAt = now;
  deal.releasedAt = now;
  // Settle escrow: debit settles on buyer, credit lands on farmer.
  for (const txn of data.walletTxns) {
    if (txn.note === `escrow:${deal.id}`) txn.status = "settled";
  }
  data.walletTxns.push({
    id: uid(),
    accountId: deal.farmerId,
    kind: "credit",
    amount: deal.amountRwf,
    currency: "RWF",
    status: "settled",
    note: `deal:${deal.id}`,
    createdAt: now,
  });
  writeData(data);
  return true;
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

/* ---------------- Seeding ---------------- */

function seedForNewAccount(account: StoredAccount) {
  const data = readData();
  const now = Date.now();
  const h = (n: number) => new Date(now + n * 3600_000).toISOString();
  const p = (n: number) => new Date(now - n * 3600_000).toISOString();

  if (account.role === "farmer") {
    // Wallet: starting balance for the demo.
    data.walletTxns.push(
      {
        id: uid(),
        accountId: account.id,
        kind: "credit",
        amount: 250000,
        currency: "RWF",
        status: "settled",
        note: "seed",
        createdAt: p(120),
      },
      {
        id: uid(),
        accountId: account.id,
        kind: "credit",
        amount: 360000,
        currency: "RWF",
        status: "settled",
        note: "deal:demo1",
        createdAt: p(24),
      }
    );

    const products: Product[] = [
      {
        id: uid(),
        farmerId: account.id,
        farmerName: account.name,
        title: "Irish potatoes",
        category: "Tubers",
        quantityKg: 500,
        pricePerKg: 1800,
        currency: "RWF",
        status: "available",
        createdAt: p(6),
      },
      {
        id: uid(),
        farmerId: account.id,
        farmerName: account.name,
        title: "Maize",
        category: "Cereals",
        quantityKg: 800,
        pricePerKg: 1200,
        currency: "RWF",
        status: "available",
        createdAt: p(28),
      },
      {
        id: uid(),
        farmerId: account.id,
        farmerName: account.name,
        title: "Arabica coffee",
        category: "Cash crop",
        quantityKg: 120,
        pricePerKg: 6000,
        currency: "RWF",
        status: "available",
        createdAt: p(52),
      },
      {
        id: uid(),
        farmerId: account.id,
        farmerName: account.name,
        title: "Beans",
        category: "Legumes",
        quantityKg: 150,
        pricePerKg: 2000,
        currency: "RWF",
        status: "sold",
        createdAt: p(90),
      },
      {
        id: uid(),
        farmerId: account.id,
        farmerName: account.name,
        title: "Live cattle (heifer)",
        category: "Livestock",
        quantityKg: 4,
        pricePerKg: 450000,
        unit: "head",
        currency: "RWF",
        status: "available",
        createdAt: p(20),
      },
      {
        id: uid(),
        farmerId: account.id,
        farmerName: account.name,
        title: "Goats",
        category: "Livestock",
        quantityKg: 12,
        pricePerKg: 95000,
        unit: "head",
        currency: "RWF",
        status: "available",
        createdAt: p(32),
      },
      {
        id: uid(),
        farmerId: account.id,
        farmerName: account.name,
        title: "Free-range chicken",
        category: "Poultry",
        quantityKg: 25,
        pricePerKg: 12000,
        unit: "unit",
        currency: "RWF",
        status: "available",
        createdAt: p(15),
      },
      {
        id: uid(),
        farmerId: account.id,
        farmerName: account.name,
        title: "Fresh milk (per litre)",
        category: "Dairy",
        quantityKg: 200,
        pricePerKg: 1400,
        unit: "litre",
        currency: "RWF",
        status: "available",
        createdAt: p(5),
      },
      {
        id: uid(),
        farmerId: account.id,
        farmerName: account.name,
        title: "Eggs",
        category: "Poultry",
        quantityKg: 60,
        pricePerKg: 400,
        unit: "dozen",
        currency: "RWF",
        status: "available",
        createdAt: p(10),
      },
    ];
    data.products.push(...products);

    // A rival farmer's product so the demo marketplace isn't farmer-only.
    const rivalId = "rival-farmer-1";
    data.products.push({
      id: uid(),
      farmerId: rivalId,
      farmerName: "Uwimana Jean",
      title: "Sweet potatoes",
      category: "Tubers",
      quantityKg: 300,
      pricePerKg: 1500,
      currency: "RWF",
      status: "available",
      createdAt: p(14),
    });
    data.products.push({
      id: uid(),
      farmerId: rivalId,
      farmerName: "Uwimana Jean",
      title: "Improved dairy cow",
      category: "Livestock",
      quantityKg: 2,
      pricePerKg: 800000,
      unit: "head",
      currency: "RWF",
      status: "available",
      createdAt: p(12),
    });

    // One incoming offer on the coffee product.
    data.offers.push({
      id: uid(),
      productId: products[2].id,
      buyerId: "demo-buyer-1",
      buyerName: "Café du Rift Export",
      pricePerKg: 6200,
      quantityKg: 100,
      currency: "RWF",
      message: "We buy every season — happy to sign a standing arrangement.",
      status: "pending",
      createdAt: p(8),
    });

    // One completed deal (paid) + one waiting on delivery confirmation.
    const dealPaid: Deal = {
      id: uid(),
      productId: products[3].id,
      offerId: "demo-offer-done",
      farmerId: account.id,
      farmerName: account.name,
      buyerId: "demo-buyer-1",
      buyerName: "Café du Rift Export",
      productTitle: "Beans",
      quantityKg: 150,
      amountRwf: 300000,
      currency: "RWF",
      status: "confirmed",
      autoReleaseInHours: 72,
      createdAt: p(96),
      confirmedAt: p(90),
      releasedAt: p(90),
      hasConditionalSettlement: true,
    };
    const dealPending: Deal = {
      id: uid(),
      productId: products[1].id,
      offerId: "demo-offer-pending",
      farmerId: account.id,
      farmerName: account.name,
      buyerId: "demo-buyer-1",
      buyerName: "Café du Rift Export",
      productTitle: "Maize",
      quantityKg: 200,
      amountRwf: 240000,
      currency: "RWF",
      status: "pending_delivery",
      autoReleaseInHours: 72,
      createdAt: p(30),
      confirmedAt: null,
      releasedAt: null,
      hasConditionalSettlement: true,
    };
    data.deals.push(dealPaid, dealPending);

    data.arrangements.push({
      id: uid(),
      farmerId: account.id,
      buyer: "Café du Rift Export",
      item: "Arabica coffee",
      pricePerKg: 6000,
      currency: "RWF",
      cadence: "monthly",
      status: "active",
      createdAt: p(400),
      nextCycle: h(120),
      totalCycles: 12,
      completedCycles: 4,
    });
  }

  if (account.role === "buyer") {
    data.walletTxns.push({
      id: uid(),
      accountId: account.id,
      kind: "credit",
      amount: 3000000,
      currency: "RWF",
      status: "settled",
      note: "seed",
      createdAt: p(200),
    });
  }

  writeData(data);
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
