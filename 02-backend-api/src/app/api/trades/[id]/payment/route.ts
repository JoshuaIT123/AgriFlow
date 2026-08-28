import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { config } from "@/lib/config";
import { db } from "@/lib/db";
import { conflict, forbidden, notFound, sendOk } from "@/lib/http";
import { lightning } from "@/lib/services/lightning";
import { transitionTrade } from "@/lib/services/trades";
import { tradeView } from "@/lib/services/views";

export const dynamic = "force-dynamic";

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

  const amountMsat = Math.round(trade.totalAmount * config.msatPerRwf);
  const invoice = await lightning.createInvoice({
    tradeId: trade.id,
    amountMsat,
    memo: `AgriFlow trade ${trade.id}`,
  });

  await db.payments.create({
    id: invoice.paymentHash,
    tradeId: trade.id,
    paymentRequest: invoice.paymentRequest,
    paymentHash: invoice.paymentHash,
    amountMsat,
    status: "PENDING",
  });

  const updated = transitionTrade(trade, "PAYMENT_PENDING");
  await db.trades.update(updated.id, updated);

  return sendOk({
    trade: await tradeView(updated),
    payment: { id: invoice.paymentHash, paymentRequest: invoice.paymentRequest },
  });
}
