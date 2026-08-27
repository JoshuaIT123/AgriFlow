import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { requireAuth, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { badRequest, conflict, forbidden, notFound, sendOk } from "@/lib/http";
import { tradeView } from "@/lib/services/views";

export const dynamic = "force-dynamic";

/**
 * POST /api/offers/[id]/accept - farmer accepts a pending offer (UC-14).
 * Creates a Trade, decrements product quantity, marks the offer ACCEPTED.
 */
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
  if (product.status !== "ACTIVE") {
    return badRequest("Product is no longer active");
  }
  if (offer.quantity > product.quantity) {
    return badRequest(
      `Not enough available quantity (remaining ${product.quantity} ${product.unit})`,
    );
  }

  const now = new Date().toISOString();
  const trade = await db.trades.create({
    id: randomUUID(),
    offerId: offer.id,
    buyerId: offer.buyerId,
    farmerId: product.farmerId,
    productId: product.id,
    quantity: offer.quantity,
    agreedPrice: offer.price,
    totalAmount: offer.totalAmount,
    status: "AGREED",
    statusHistory: [{ status: "AGREED", at: now }],
  });

  await db.products.update(product.id, {
    quantity: product.quantity - offer.quantity,
  });
  await db.offers.update(offer.id, { status: "ACCEPTED" });

  return sendOk({ trade: await tradeView(trade) }, 201);
}
