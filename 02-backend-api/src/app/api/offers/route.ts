import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { badRequest, forbidden, notFound, sendOk } from "@/lib/http";
import { offerView, tradeView } from "@/lib/services/views";

export const dynamic = "force-dynamic";

const createOfferSchema = z.object({
  productId: z.string().min(1, "productId is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  price: z.coerce.number().positive("Price must be greater than 0"),
});

/**
 * POST /api/offers - buyer creates an offer (UC-11).
 *
 * The backend computes total_amount (business rule: never trust client money).
 *
 * An offer at or above the asking price is accepted immediately and opens the
 * trade: the farmer already published those terms, so there is nothing left to
 * agree. A lower offer is a genuine negotiation and stays PENDING for the
 * farmer to answer.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;
  const roleErr = requireRole(auth.user, ["BUYER"]);
  if (roleErr) return roleErr;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const parsed = createOfferSchema.safeParse(body);
  if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());
  const { productId, quantity, price } = parsed.data;

  const product = await db.products.findById(productId);
  if (!product || product.status !== "ACTIVE") {
    return notFound("Product not found or not available");
  }
  if (product.farmerId === auth.user.id) {
    return forbidden("You cannot make an offer on your own product");
  }
  if (quantity > product.quantity) {
    return badRequest(
      `Offer quantity cannot exceed available quantity (${product.quantity} ${product.unit})`,
    );
  }

  // Backend always computes the money (never trust the frontend amount).
  const totalAmount = Math.round(quantity * price * 100) / 100;

  const meetsAsking = price >= product.price;

  const offer = await db.offers.create({
    id: randomUUID(),
    buyerId: auth.user.id,
    productId,
    quantity,
    price,
    totalAmount,
    status: meetsAsking ? "ACCEPTED" : "PENDING",
  });

  if (!meetsAsking) {
    return sendOk({ offer: await offerView(offer), trade: null }, 201);
  }

  const now = new Date().toISOString();
  const trade = await db.trades.create({
    id: randomUUID(),
    offerId: offer.id,
    buyerId: auth.user.id,
    farmerId: product.farmerId,
    productId: product.id,
    quantity,
    agreedPrice: price,
    totalAmount,
    status: "AGREED",
    statusHistory: [{ status: "AGREED", at: now }],
  });

  await db.products.update(product.id, {
    quantity: product.quantity - quantity,
  });

  return sendOk(
    { offer: await offerView(offer), trade: await tradeView(trade) },
    201,
  );
}