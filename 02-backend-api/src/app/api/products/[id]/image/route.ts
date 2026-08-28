import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  badRequest,
  forbidden,
  notFound,
  sendDomainError,
  sendOk,
} from "@/lib/http";
import {
  deleteProductImage,
  readProductImage,
  saveProductImage,
} from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * GET /api/products/:id/image - serve the product photo (local file storage).
 * Visible to authenticated users for ACTIVE products; deactivated products'
 * photos are visible only to their owner (or ADMIN) - matching product rules.
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

  const image = await readProductImage(product.id);
  if (!image) return notFound("Image not found");

  return new NextResponse(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

/**
 * POST /api/products/:id/image - upload/replace the product photo.
 * Only the owning farmer (or ADMIN). Body: multipart/form-data with `image`.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  const product = await db.products.findById(params.id);
  if (!product) return notFound("Product not found");

  if (product.farmerId !== auth.user.id && auth.user.role !== "ADMIN") {
    return forbidden("Only the product owner can change the product image");
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return badRequest("Invalid multipart body");
  }

  const entry = form.get("image");
  if (!(entry instanceof File)) {
    return badRequest("Upload an image file in the 'image' field");
  }

  try {
    const imageUrl = await saveProductImage(product.id, entry);
    const updated = await db.products.setImageUrl(product.id, imageUrl);
    if (!updated) return notFound("Product not found");
    return sendOk({ product: updated });
  } catch (err) {
    return sendDomainError(err);
  }
}

/**
 * DELETE /api/products/:id/image - remove the product photo.
 * Only the owning farmer (or ADMIN).
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
    return forbidden("Only the product owner can change the product image");
  }

  await deleteProductImage(product.id);
  const updated = await db.products.setImageUrl(product.id, null);
  if (!updated) return notFound("Product not found");

  return sendOk({ product: updated });
}