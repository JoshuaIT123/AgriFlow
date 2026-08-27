import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendOk } from "@/lib/http";
import { offerViews } from "@/lib/services/views";

export const dynamic = "force-dynamic";

/** GET /api/offers/my - buyer views own offers (UC-12). */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  const offers =
    auth.user.role === "ADMIN"
      ? await db.offers.listForProducts((await db.products.listActive()).map((p) => p.id))
      : await db.offers.listByBuyer(auth.user.id);

  return sendOk({ offers: await offerViews(offers) });
}