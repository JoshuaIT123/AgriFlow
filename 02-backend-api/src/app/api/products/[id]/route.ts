import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { badRequest, forbidden, notFound, sendOk } from "@/lib/http";

export const dynamic = "force-dynamic";

/** GET /api/products/:id - product details (UC-08). */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(_request);
  if ("error" in auth) return auth.error;

  const product = await db.products.findById(params.id);
  if (!product) return notFound("Product not found");

  // Deactivated products are only visible to their owner (or ADMIN).
  if (
    product.status !== "ACTIVE" &&
    product.farmerId !== auth.user.id &&
    auth.user.role !== "ADMIN"
  ) {
    return notFound("Product not found");
  }

  return sendOk({ product });
}

const updateProductSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  quantity: z.coerce.number().positive().optional(),
  unit: z.string().trim().min(1).max(20).optional(),
  price: z.coerce.number().positive().optional(),
  location: z.string().trim().min(1).max(200).optional(),
  quality: z.string().trim().max(120).optional(),
});

/** PATCH /api/products/:id - farmer updates own product (UC-09). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  const product = await db.products.findById(params.id);
  if (!product) return notFound("Product not found");

  if (product.farmerId !== auth.user.id && auth.user.role !== "ADMIN") {
    return forbidden("Only the product owner can update this product");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

  const updated = await db.products.update(params.id, parsed.data);
  if (!updated) return notFound("Product not found");

  return sendOk({ product: updated });
}

/**
 * DELETE /api/products/:id - farmer deactivates own product (UC-10).
 * Soft delete: status -> DEACTIVATED (history is preserved).
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
    return forbidden("Only the product owner can deactivate this product");
  }

  const updated = await db.products.update(params.id, { status: "DEACTIVATED" });
  if (!updated) return notFound("Product not found");

  return sendOk({ product: updated });
}