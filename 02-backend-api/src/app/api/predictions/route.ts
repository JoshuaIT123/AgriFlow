import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { DomainError } from "@/lib/errors";
import { sendError, sendOk } from "@/lib/http";
import { buildPredictions } from "@/lib/services/predictions";

export const dynamic = "force-dynamic";
// Model calls are slow; give the function room beyond the default.
export const maxDuration = 60;

/**
 * GET /api/predictions - AI price and demand outlook for the caller.
 *
 * Farmers get an outlook on their own listings, buyers on the whole active
 * market. Advisory only: nothing here writes to a product, offer or trade.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  try {
    return sendOk({ predictions: await buildPredictions(auth.user) });
  } catch (err) {
    if (err instanceof DomainError) return sendError(err.message, err.status);
    throw err;
  }
}
