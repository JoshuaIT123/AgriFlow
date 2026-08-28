import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { badRequest, forbidden, notFound, sendOk } from "@/lib/http";
import { productView } from "@/lib/services/views";

export const dynamic = "force-dynamic";

const updateProductSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120, "Name too long"),
    quantity: z.coerce.number().positive("Quantity must be greater than 0"),
    unit: z.string().trim().min(1, "Unit is required").max(20),
    price: z.coerce.number().positive("Price must be greater than 0"),
    location: z.string().trim().min(1, "Location is required").max(200),
    quality: z.string().trim().max(120),
  })
  .partial();

/**
 * GET /api/products/:id - product details (UC-08).
 * ACTIVE products are visible to every authenticated user; deactivated ones
 * only to their owner (or ADMIN).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(_request);
  if ("error" in auth) return auth.error;

  const product = await db.products.findById(params.id);
  if (!product) return notFound("Product not found");
  if (
    product.status !== "ACTIVE" &&
    product.farmerId !== auth.user.id &&
    auth.user.role !== "ADMIN"
  ) {
    return notFound("Product not found");
  }

  return sendOk({ product: await productView(product) });
}

/**
 * PATCH /api/products/:id - farmer updates their product (UC-09).
 * Only the product owner (or ADMIN). Status is intentionally not patchable -
 * deactivation goes through DELETE to keep transitions explicit.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  const product = await db.products.findById(params.id);
  if (!product) return notFound("Product not found");
  if (product.farmerId !== auth.user.id && auth.user.role !== "ADMIN") {
    return forbidden("Only the product owner can update the product");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

  const updated = await db.products.update(product.id, parsed.data);
  if (!updated) return notFound("Product not found");

  return sendOk({ product: await productView(updated) });
}

/**
 * DELETE /api/products/:id - deactivate a product (UC-10).
 * Only the product owner (or ADMIN). Soft-delete: the product stays in the
 * database (historical trades/offers keep working) but disappears from browse.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(_request);
  if ("error" in auth) return auth.error;

  const product = await db.products.findById(params.id);
  if (!product) return notFound("Product not found");
  if (product.farmerId !== auth.user.id && auth.user.role !== "ADMIN") {
    return forbidden("Only the product owner can deactivate the product");
  }

  const updated = await db.products.update(product.id, { status: "DEACTIVATED" });
  if (!updated) return notFound("Product not found");

  return sendOk({ product: await productView(updated) });
}
