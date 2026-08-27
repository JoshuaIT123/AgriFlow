import { NextRequest } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendOk } from "@/lib/http";
import { offerView } from "@/lib/services/views";

export const dynamic = "force-dynamic";

/**
 * GET /api/offers/received - farmer views offers on own products (UC-13).
 * Pending offers are listed first, then newest.
 */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if ("error" in auth) return auth.error;
  const roleErr = requireRole(auth.user, ["FARMER", "ADMIN"]);
  if (roleErr) return roleErr;

  const productIds = db.products
    .listByFarmer(auth.user.id)
    .map((p) => p.id);
  const offers = db.offers.listForProducts(productIds);

  offers.sort((a, b) => {
    if (a.status === "PENDING" && b.status !== "PENDING") return -1;
    if (b.status === "PENDING" && a.status !== "PENDING") return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return sendOk({ offers: offers.map(offerView) });
}