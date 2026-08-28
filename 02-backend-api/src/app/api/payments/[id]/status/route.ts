import { NextRequest } from "next/server";
import { requireAuth, canAccessTrade } from "@/lib/auth";
import { db } from "@/lib/db";
import { forbidden, notFound, sendOk } from "@/lib/http";
import { lightning } from "@/lib/services/lightning";
import { transitionTrade } from "@/lib/services/trades";
import { tradeView } from "@/lib/services/views";

export const dynamic = "force-dynamic";

/**
 * GET /api/payments/:id/status - request payment status from the Lightning
 * layer (UC-22, UC-23). Only payment status from Lightning may move a trade
 * to PAID/PAYMENT_LOCKED/DELIVERY_PENDING (business rule 11/12).
 *
 *  - Lightning reports PAID  -> payment PAID, trade locks payment then enters
 *    DELIVERY_PENDING (both recorded in statusHistory).
 *  - Lightning reports FAILED -> payment FAILED, trade returns to AGREED.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(_request);
  if ("error" in auth) return auth.error;

  const payment = await db.payments.findById(params.id);
  if (!payment) return notFound("Payment not found");

  const trade = await db.trades.findById(payment.tradeId);
  if (!trade) return notFound("Trade not found");

  if (!canAccessTrade(auth.user, trade)) {
    return forbidden("You do not have access to this payment");
  }

  const result = await lightning.checkPayment(payment.paymentHash);

  if (result.failed && payment.status !== "FAILED") {
    await db.payments.update(payment.id, { status: "FAILED" });
    if (trade.status === "PAYMENT_PENDING") {
      const updated = transitionTrade(trade, "AGREED");
      await db.trades.update(updated.id, updated);
      return sendOk({
        payment: await db.payments.findById(payment.id),
        trade: await tradeView(updated),
      });
    }
  } else if (result.paid && payment.status !== "PAID") {
    await db.payments.update(payment.id, {
      status: "PAID",
      paidAt: result.settledAt ?? new Date().toISOString(),
    });
    if (trade.status === "PAYMENT_PENDING") {
      const locked = transitionTrade(trade, "PAYMENT_LOCKED");
      const delivery = transitionTrade(locked, "DELIVERY_PENDING");
      await db.trades.update(delivery.id, delivery);
      return sendOk({
        payment: await db.payments.findById(payment.id),
        trade: await tradeView(delivery),
      });
    }
  }

  return sendOk({
    payment: await db.payments.findById(payment.id),
    trade: await tradeView(trade),
  });
}