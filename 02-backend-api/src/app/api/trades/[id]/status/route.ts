import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { DomainError } from "@/lib/errors";
import { badRequest, notFound, sendError, sendOk, unauthorized } from "@/lib/http";
import { transitionTrade } from "@/lib/services/trades";
import { tradeView } from "@/lib/services/views";

export const dynamic = "force-dynamic";

const statusSchema = z.object({
  status: z.enum([
    "PAYMENT_LOCKED",
    "DELIVERY_PENDING",
    "DELIVERED",
    "SETTLED",
    "CANCELLED",
    "AGREED",
  ]),
});

/**
 * PATCH /api/trades/:id/status - internal service-to-service transition.
 *
 * Called by the Lightning layer when an invoice settles or fails, not by an
 * end user: authentication is the shared INTERNAL_SERVICE_KEY rather than a
 * user Bearer token. The trade state machine still governs which transitions
 * are legal, so an out-of-order callback is rejected with 409 instead of
 * corrupting the trade.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const expected = process.env.INTERNAL_SERVICE_KEY;
  if (!expected) {
    return sendError("INTERNAL_SERVICE_KEY is not configured", 500);
  }
  if (request.headers.get("x-internal-key") !== expected) {
    return unauthorized("Invalid internal service key");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  const trade = await db.trades.findById(params.id);
  if (!trade) return notFound("Trade not found");

  try {
    const updated = transitionTrade(trade, parsed.data.status);
    await db.trades.update(updated.id, updated);
    return sendOk({ trade: await tradeView(updated) });
  } catch (err) {
    if (err instanceof DomainError) {
      return sendError(err.message, err.status);
    }
    throw err;
  }
}