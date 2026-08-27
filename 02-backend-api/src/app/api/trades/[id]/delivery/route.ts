import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conflict, forbidden, notFound, sendOk } from "@/lib/http";
import { transitionTrade } from "@/lib/services/trades";
import { tradeView } from "@/lib/services/views";

export const dynamic = "force-dynamic";

/**
 * POST /api/trades/:id/delivery - buyer confirms delivery (UC-24).
 * Only allowed once payment is locked / delivery is pending.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = requireAuth(request);
  if ("error" in auth) return auth.error;

  const trade = db.trades.findById(params.id);
  if (!trade) return notFound("Trade not found");

  if (trade.buyerId !== auth.user.id && auth.user.role !== "ADMIN") {
    return forbidden("Only the buyer can confirm delivery");
  }

  if (trade.status !== "DELIVERY_PENDING" && trade.status !== "PAYMENT_LOCKED") {
    return conflict(
      "Delivery can only be confirmed after payment has been received",
    );
  }

  const updated = transitionTrade(trade, "DELIVERED");
  db.trades.update(updated.id, updated);

  return sendOk({ trade: tradeView(updated) });
}