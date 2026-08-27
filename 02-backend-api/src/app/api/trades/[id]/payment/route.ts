import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { requireAuth } from "@/lib/auth";
import { config } from "@/lib/config";
import { db } from "@/lib/db";
import { conflict, forbidden, notFound, sendOk } from "@/lib/http";
import { lightning } from "@/lib/services/lightning";
import { transitionTrade } from "@/lib/services/trades";
import { tradeView } from "@/lib/services/views";

export const dynamic = "force-dynamic";

/**
 * POST /api/trades/:id/payment - request payment + Lightning invoice
 * (UC-20, UC-21). Only the trade buyer. Requires trade in AGREED.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  const trade = await db.trades.findById(params.id);
  if (!trade) return notFound("Trade not found");

  if (trade.buyerId !== auth.user.id && auth.user.role !== "ADMIN") {
    return forbidden("Only the buyer can request payment for this trade");
  }

  if (trade.status !== "AGREED") {
    return conflict(
      "Payment can only be requested when the trade is in AGREED state",
    );
  }

  // Convert trade total (RWF) to millisatoshis for the Lightning layer.
  const amountMsat = Math.round(trade.totalAmount * config.msatPerRwf);
  const invoice = await lightning.createInvoice({
    tradeId: trade.id,
    amountMsat,
    memo: `AgriFlow trade ${trade.id}`,
  });

  const now = new Date().toISOString();
  const payment = await db.payments.create({
    id: randomUUID(),
    tradeId: trade.id,
    paymentRequest: invoice.paymentRequest,
    paymentHash: invoice.paymentHash,
    amountMsat,
    status: "PENDING",
    createdAt: now,
  });

  const updated = transitionTrade(trade, "PAYMENT_PENDING");
  await db.trades.update(updated.id, updated);

  return sendOk({ payment, trade: await tradeView(updated) }, 201);
}