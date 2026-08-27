import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conflict, forbidden, notFound, sendOk } from "@/lib/http";
import { offerView } from "@/lib/services/views";

export const dynamic = "force-dynamic";

/** POST /api/offers/:id/reject - farmer rejects an offer (UC-15). */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  const offer = await db.offers.findById(params.id);
  if (!offer) return notFound("Offer not found");

  const product = await db.products.findById(offer.productId);
  if (!product || product.farmerId !== auth.user.id) {
    return forbidden("Only the product owner can reject this offer");
  }

  if (offer.status !== "PENDING") {
    return conflict(`Offer has already been ${offer.status.toLowerCase()}`);
  }

  const updated = await db.offers.update(offer.id, { status: "REJECTED" });
  if (!updated) return notFound("Offer not found");

  return sendOk({ offer: await offerView(updated) });
}