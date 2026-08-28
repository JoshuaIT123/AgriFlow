import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { badRequest, conflict, forbidden, notFound, sendOk } from "@/lib/http";
import { tradeView } from "@/lib/services/views";

export const dynamic = "force-dynamic";

const buySchema = z.object({
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
});

/**
 * POST /api/products/:id/buy - buy now at the asking price.
 *
 * Offer-and-accept exists because a buyer may propose a *different* price,
 * which the farmer has to agree to. Buying at the listed price needs no such
 * agreement - the farmer already published those terms - so this records the
 * offer as accepted and opens the trade in one step.
 *
 * The price is taken from the product, never from the request: a client that
 * could name its own price could buy at any figure.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

  const parsed = buySchema.safeParse(body);
  if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());
  const { quantity } = parsed.data;

  const product = await db.products.findById(params.id);
  if (!product || product.status !== "ACTIVE") {
    return notFound("Product not found or not available");
  }
  if (product.farmerId === auth.user.id) {
    return forbidden("You cannot buy your own product");
  }
  if (quantity > product.quantity) {
    return conflict(
      `Only ${product.quantity} ${product.unit} available`,
    );
  }

  const totalAmount = Math.round(quantity * product.price * 100) / 100;
  const now = new Date().toISOString();

  const offer = await db.offers.create({
    id: randomUUID(),
    buyerId: auth.user.id,
    productId: product.id,
    quantity,
    price: product.price,
    totalAmount,
    status: "ACCEPTED",
  });

  const trade = await db.trades.create({
    id: randomUUID(),
    offerId: offer.id,
    buyerId: auth.user.id,
    farmerId: product.farmerId,
    productId: product.id,
    quantity,
    agreedPrice: product.price,
    totalAmount,
    status: "AGREED",
    statusHistory: [{ status: "AGREED", at: now }],
  });

  await db.products.update(product.id, {
    quantity: product.quantity - quantity,
  });

  return sendOk({ trade: await tradeView(trade) }, 201);
}
