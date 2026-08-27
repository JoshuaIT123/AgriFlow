import { db } from "../db";
import { toPublicUser } from "../db/users";
import type { Trade, User } from "../types";
import { offerView, productView, tradeView } from "./views";

const TERMINAL = new Set(["SETTLED", "CANCELLED"]);

function statusCounts(trades: Trade[]) {
  const byStatus: Record<string, number> = {};
  for (const t of trades) byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
  return byStatus;
}

/** Role-aware summary used by GET /api/dashboard (UC-26/27). */
export async function buildDashboard(user: User) {
  if (user.role === "FARMER") {
    const products = await db.products.listByFarmer(user.id);
    const offers = await db.offers.listForProducts(products.map((p) => p.id));
    const trades = await db.trades.listByFarmer(user.id);
    const settled = trades.filter((t) => t.status === "SETTLED");

    return {
      role: "FARMER" as const,
      user: toPublicUser(user),
      products: {
        total: products.length,
        active: products.filter((p) => p.status === "ACTIVE").length,
        recent: products.slice(0, 5).map(productView),
      },
      offers: {
        pending: offers.filter((o) => o.status === "PENDING").length,
        recent: await Promise.all(offers.slice(0, 5).map(async (o) => await offerView(o))),
      },
      trades: {
        active: trades.filter((t) => !TERMINAL.has(t.status)).length,
        byStatus: statusCounts(trades),
        totalRevenue: settled.reduce((sum, t) => sum + t.totalAmount, 0),
        recent: await Promise.all(trades.slice(0, 5).map(async (t) => await tradeView(t))),
      },
    };
  }

  if (user.role === "BUYER") {
    const offers = await db.offers.listByBuyer(user.id);
    const trades = await db.trades.listByBuyer(user.id);
    const settled = trades.filter((t) => t.status === "SETTLED");

    return {
      role: "BUYER" as const,
      user: toPublicUser(user),
      offers: {
        total: offers.length,
        pending: offers.filter((o) => o.status === "PENDING").length,
        recent: await Promise.all(offers.slice(0, 5).map(async (o) => await offerView(o))),
      },
      trades: {
        active: trades.filter((t) => !TERMINAL.has(t.status)).length,
        byStatus: statusCounts(trades),
        totalSpent: settled.reduce((sum, t) => sum + t.totalAmount, 0),
        recent: await Promise.all(trades.slice(0, 5).map(async (t) => await tradeView(t))),
      },
    };
  }

  const [usersAll, productsActive, tradesForUser] = await Promise.all([
    db.users.all(),
    db.products.listActive(),
    db.trades.listForUser(user.id),
  ]);

  return {
    role: user.role,
    user: toPublicUser(user),
    users: usersAll.length,
    products: productsActive.length,
    trades: tradesForUser.length,
  };
}
