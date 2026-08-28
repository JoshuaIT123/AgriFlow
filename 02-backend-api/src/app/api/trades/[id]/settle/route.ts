import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conflict, forbidden, notFound, sendError, sendOk } from "@/lib/http";
import { payFarmer } from "@/lib/services/payouts";
import { transitionTrade } from "@/lib/services/trades";
import { tradeView } from "@/lib/services/views";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  const trade = await db.trades.findById(params.id);
  if (!trade) return notFound("Trade not found");

  if (trade.farmerId !== auth.user.id && auth.user.role !== "ADMIN") {
    return forbidden("Only the farmer can settle this trade");
  }

  if (trade.status !== "DELIVERED") {
    return conflict(
      "A trade can only be settled after it has been delivered and paid",
    );
  }

  const payout = await payFarmer(trade);
  if (!payout.paid) {
    return sendError(`Farmer payout failed: ${payout.error ?? "unknown error"}`, 502);
  }

  const updated = transitionTrade(trade, "SETTLED");
  await db.trades.update(updated.id, updated);

  const [payment] = await db.payments.findByTrade(trade.id);
  if (payment && payment.status === "PAID" && !payment.settledAt) {
    await db.payments.update(payment.id, { settledAt: new Date().toISOString() });
  }

  return sendOk({ trade: await tradeView(updated), payout });
}
