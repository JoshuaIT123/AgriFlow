import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conflict, forbidden, notFound, sendOk } from "@/lib/http";
import { tradeView } from "@/lib/services/views";

export const dynamic = "force-dynamic";

/**
 * POST /api/offers/:id/accept - farmer accepts an offer (UC-14).
 * An accepted offer produces a valid Trade (UC-16). The trade is created in
 * AGREED state (offer acceptance = agreement on terms). Product stock is
 * reduced by the offered quantity.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = requireAuth(request);
  if ("error" in auth) return auth.error;

  const offer = db.offers.findById(params.id);
  if (!offer) return notFound("Offer not found");

  const product = db.products.findById(offer.productId);

  // Only the product owner can accept.
  if (!product || product.farmerId !== auth.user.id) {
    return forbidden("Only the product owner can accept this offer");
  }

  if (offer.status !== "PENDING") {
    return conflict(`Offer has already been ${offer.status.toLowerCase()}`);
  }
  if (product.status !== "ACTIVE") {
    return conflict("The product is no longer available");
  }
  if (offer.quantity > product.quantity) {
    return conflict(
      `Not enough available quantity (remaining ${product.quantity} ${product.unit})`,
    );
  }

  const now = new Date().toISOString();
  const trade = db.trades.create({
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
    createdAt: now,
    updatedAt: now,
  });

  db.products.update(product.id, {
    quantity: product.quantity - offer.quantity,
  });
  db.offers.update(offer.id, { status: "ACCEPTED" });

  return sendOk({ trade: tradeView(trade) }, 201);
}