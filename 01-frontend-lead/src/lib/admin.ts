"use client";

import { cachedDeals, cachedOffers, cachedProducts } from "./remote";
import {
  getAllAccounts,
  getAllWalletTxns,
  getChatMessages,
  getChatThreads,
} from "./store";
import type { ChatMessage } from "./types";

/*
 * Admin console support.
 *
 * The backend has no admin model yet, so this console monitors what the
 * device can already see: the synced products/offers/trades plus the
 * local-first wallet, accounts and chat. The views are structured so they
 * light up with more depth once admin API endpoints come online.
 */

const ADMIN_KEY = "agriflow.admin.v2";

export function isAdminActive(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ADMIN_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAdminActive(active: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (active) window.localStorage.setItem(ADMIN_KEY, "1");
    else window.localStorage.removeItem(ADMIN_KEY);
  } catch {
    // non-fatal
  }
}

export interface AdminKpis {
  users: number;
  farmers: number;
  buyers: number;
  liveProducts: number;
  pendingOffers: number;
  activeTrades: number;
  escrowHeld: number;
  releasedVolume: number;
  volumeTotal: number;
  walletFunds: number;
  chatThreads: number;
  chatMessages: number;
}

export function adminKpis(): AdminKpis {
  const deals = cachedDeals();
  const offers = cachedOffers();
  const products = cachedProducts();
  const txns = getAllWalletTxns();
  const threads = getChatThreads();
  const done =
    deals.filter((d) =>
      ["confirmed", "released", "auto_released"].includes(d.status)
    );
  return {
    users: countUsers().length,
    farmers: countUsers().filter((u) => u.role === "farmer").length,
    buyers: countUsers().filter((u) => u.role === "buyer").length,
    liveProducts: products.filter((p) => p.status === "available").length,
    pendingOffers: offers.filter((o) => o.status === "pending").length,
    activeTrades: deals.filter((d) => d.status === "pending_delivery").length,
    escrowHeld: deals
      .filter((d) => d.status === "pending_delivery")
      .reduce((sum, d) => sum + d.amountRwf, 0),
    releasedVolume: done.reduce((sum, d) => sum + d.amountRwf, 0),
    volumeTotal: deals.reduce((sum, d) => sum + d.amountRwf, 0),
    walletFunds: txns
      .filter((t) => t.status === "settled")
      .reduce((sum, t) => sum + (t.kind === "credit" ? t.amount : -t.amount), 0),
    chatThreads: threads.length,
    chatMessages: threads.reduce(
      (sum, th) => sum + getChatMessages(th.id).length,
      0
    ),
  };
}

export interface AdminUser {
  id: string;
  name: string;
  role: "farmer" | "buyer";
  phone?: string;
  products: number;
  offers: number;
  deals: number;
  volume: number;
}

/**
 * Builds a system-wide user registry by merging the accounts recorded on this
 * device with every farmer/buyer mentioned in the cached products, offers and
 * trades. Users are keyed by id.
 */
export function countUsers(): AdminUser[] {
  const map = new Map<string, AdminUser>();
  const touch = (id: string, name: string, role: AdminUser["role"]) => {
    let u = map.get(id);
    if (!u) {
      u = { id, name, role, products: 0, offers: 0, deals: 0, volume: 0 };
      map.set(id, u);
    }
    return u;
  };

  const products = cachedProducts();
  const productById = new Map(products.map((p) => [p.id, p]));

  for (const p of products) {
    touch(p.farmerId, p.farmerName, "farmer").products += 1;
  }
  for (const o of cachedOffers()) {
    touch(o.buyerId, o.buyerName, "buyer").offers += 1;
    const p = productById.get(o.productId);
    if (p) touch(p.farmerId, p.farmerName, "farmer").offers += 1;
  }
  for (const d of cachedDeals()) {
    touch(d.farmerId, d.farmerName, "farmer").deals += 1;
    touch(d.buyerId, d.buyerName, "buyer").deals += 1;
    touch(d.farmerId, d.farmerName, "farmer").volume += d.amountRwf;
    touch(d.buyerId, d.buyerName, "buyer").volume += d.amountRwf;
  }
  for (const a of getAllAccounts()) {
    const u = touch(a.id, a.name, a.role);
    u.phone = a.phone;
  }

  return [...map.values()].sort((a, b) => b.volume - a.volume);
}

export function categoryBreakdown(): { category: string; count: number }[] {
  const map = new Map<string, number>();
  for (const p of cachedProducts()) {
    map.set(p.category, (map.get(p.category) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

export interface AdminActivity {
  id: string;
  kind: "deal" | "offer" | "product";
  title: string;
  subtitle: string;
  at: string;
}

export function adminActivity(): AdminActivity[] {
  const items: AdminActivity[] = [];
  for (const d of cachedDeals()) {
    items.push({
      id: d.id,
      kind: "deal",
      title: d.productTitle,
      subtitle: `${d.farmerName} ↔ ${d.buyerName}`,
      at: d.createdAt,
    });
  }
  for (const o of cachedOffers()) {
    const p = cachedProducts().find((p) => p.id === o.productId);
    items.push({
      id: o.id,
      kind: "offer",
      title: o.buyerName,
      subtitle: p?.title ?? o.productId.slice(0, 6),
      at: o.createdAt,
    });
  }
  for (const p of cachedProducts()) {
    items.push({
      id: p.id,
      kind: "product",
      title: p.title,
      subtitle: p.farmerName,
      at: p.createdAt,
    });
  }
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 10);
}

export interface AdminConversation {
  threadId: string;
  participantNames: string[];
  productTitle?: string;
  messages: number;
  lastMessage?: string;
  lastAt?: string;
}

export function adminConversations(): AdminConversation[] {
  return getChatThreads()
    .map((th) => {
      const msgs: ChatMessage[] = getChatMessages(th.id);
      const last = msgs[msgs.length - 1];
      return {
        threadId: th.id,
        participantNames: th.participantIds
          .map((id) => th.participants[id]?.name ?? "")
          .filter(Boolean),
        productTitle: th.productTitle,
        messages: msgs.length,
        lastMessage: last && last.kind === "text" ? last.text : undefined,
        lastAt: last?.createdAt,
      };
    })
    .sort((a, b) => ((b.lastAt ?? "")).localeCompare(a.lastAt ?? ""));
}

/** Hours until a trade auto-releases (fixed 72h window per trade). */
export function dealEtaHours(createdAt: string): number {
  const eta = new Date(createdAt).getTime() + 72 * 3600_000;
  return Math.max(0, (eta - Date.now()) / 3600_000);
}