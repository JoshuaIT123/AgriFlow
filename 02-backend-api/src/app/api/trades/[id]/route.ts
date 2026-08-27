import { NextRequest } from "next/server";
import { requireAuth, canAccessTrade } from "@/lib/auth";
import { db } from "@/lib/db";
import { forbidden, notFound, sendOk } from "@/lib/http";
import { tradeView } from "@/lib/services/views";

export const dynamic = "force-dynamic";

/** GET /api/trades/:id - view a trade (UC-17). */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = requireAuth(_request);
  if ("error" in auth) return auth.error;

  const trade = db.trades.findById(params.id);
  if (!trade) return notFound("Trade not found");

  if (!canAccessTrade(auth.user, trade)) {
    return forbidden("You do not have access to this trade");
  }

  return sendOk({ trade: tradeView(trade) });
}