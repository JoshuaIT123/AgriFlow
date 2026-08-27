import { NextRequest } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { conflict, forbidden, notFound, sendOk } from "@/lib/http";
import { offerView } from "@/lib/services/views";

export const dynamic = "force-dynamic";

/** POST /api/offers/[id]/reject - farmer rejects a pending offer (UC-15). */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;
  const roleErr = requireRole(auth.user, ["FARMER", "ADMIN"]);
  if (roleErr) return roleErr;

  const offer = await db.offers.findById(params.id);
  if (!offer) return notFound("Offer not found");

  const product = await db.products.findById(offer.productId);
  if (!product || product.farmerId !== auth.user.id) {
    return forbidden("You do not own the product for this offer");
  }

  if (offer.status !== "PENDING") {
    return conflict(`Offer has already been ${offer.status.toLowerCase()}`);
  }

  const updated = await db.offers.update(offer.id, { status: "REJECTED" });

  return sendOk({ offer: updated ? await offerView(updated) : null });
}
