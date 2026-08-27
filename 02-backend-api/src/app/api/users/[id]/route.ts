import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendOk } from "@/lib/http";
import { tradeView } from "@/lib/services/views";

export const dynamic = "force-dynamic";

/**
 * GET /api/trades - trade history for the current user (UC-18).
 * Optional ?role=buyer|farmer narrows the list; default returns all trades
 * the user participates in (as buyer or farmer).
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");

  let trades;
  if (role === "buyer") {
    trades = await db.trades.listByBuyer(auth.user.id);
  } else if (role === "farmer") {
    trades = await db.trades.listByFarmer(auth.user.id);
  } else {
    trades = await db.trades.listForUser(auth.user.id);
  }

  return sendOk({ trades: trades.map(async (t) => await tradeView(t)) });
}