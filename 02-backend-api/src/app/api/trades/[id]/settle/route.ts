import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conflict, forbidden, notFound, sendOk } from "@/lib/http";
import { transitionTrade } from "@/lib/services/trades";
import { tradeView } from "@/lib/services/views";

export const dynamic = "force-dynamic";

/**
 * POST /api/trades/:id/settle - settle a completed trade (UC-25).
 * Only the farmer (recipient) or ADMIN. Requires DELIVERED.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = requireAuth(request);
  if ("error" in auth) return auth.error;

  const trade = db.trades.findById(params.id);
  if (!trade) return notFound("Trade not found");

  if (trade.farmerId !== auth.user.id && auth.user.role !== "ADMIN") {
    return forbidden("Only the farmer can settle this trade");
  }

  if (trade.status !== "DELIVERED") {
    return conflict(
      "A trade can only be settled after it has been delivered and paid",
    );
  }

  const updated = transitionTrade(trade, "SETTLED");
  db.trades.update(updated.id, updated);

  const [payment] = db.payments.findByTrade(trade.id);
  if (payment && payment.status === "PAID" && !payment.settledAt) {
    db.payments.update(payment.id, { settledAt: new Date().toISOString() });
  }

  return sendOk({ trade: tradeView(updated) });
}