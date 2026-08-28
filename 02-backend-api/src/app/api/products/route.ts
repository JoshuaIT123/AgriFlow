import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { badRequest, sendDomainError, sendOk } from "@/lib/http";
import { productView } from "@/lib/services/views";
import { saveProductImage } from "@/lib/storage";

export const dynamic = "force-dynamic";

const createProductSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120, "Name too long"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unit: z.string().trim().min(1, "Unit is required").max(20),
  price: z.coerce.number().positive("Price must be greater than 0"),
  location: z.string().trim().min(1, "Location is required").max(200),
  quality: z.string().trim().max(120).optional().default(""),
});

/** True when the client sent multipart/form-data (product + optional image). */
function isMultipart(request: NextRequest): boolean {
  return (request.headers.get("content-type") ?? "").includes("multipart/form-data");
}

/**
 * POST /api/products - farmer creates a product (UC-06).
 *
 * Accepts either:
 *   JSON:                    { name, quantity, unit, price, location, quality }
 *   multipart/form-data:     same fields as form fields + optional `image` file
 *
 * The image (when present) is stored locally in uploads/products and exposed
 * via product.imageUrl -> GET /api/products/:id/image.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;
  const roleErr = requireRole(auth.user, ["FARMER"]);
  if (roleErr) return roleErr;

  let parsed: ReturnType<typeof createProductSchema.safeParse>;
  let imageFile: File | undefined;

  if (isMultipart(request)) {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return badRequest("Invalid multipart body");
    }
    const entry = form.get("image");
    if (entry instanceof File) imageFile = entry;
    else if (typeof entry === "string" && entry.trim() !== "") {
      return badRequest("The 'image' field must be a file upload");
    }

    parsed = createProductSchema.safeParse({
      name: form.get("name"),
      quantity: form.get("quantity"),
      unit: form.get("unit"),
      price: form.get("price"),
      location: form.get("location"),
      quality: form.get("quality") ?? "",
    });
  } else {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid JSON body");
    }
    parsed = createProductSchema.safeParse(body);
  }

  if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());
  const { name, quantity, unit, price, location, quality } = parsed.data;

  let product = await db.products.create({
    id: randomUUID(),
    farmerId: auth.user.id,
    name,
    quantity,
    unit,
    price,
    location,
    quality,
    status: "ACTIVE",
  });

  if (imageFile) {
    try {
      const imageUrl = await saveProductImage(product.id, imageFile);
      const updated = await db.products.update(product.id, { imageUrl });
      if (updated) product = updated;
    } catch (err) {
      return sendDomainError(err);
    }
  }

  return sendOk({ product: await productView(product) }, 201);
}

/**
 * GET /api/products - browse products (UC-07).
 * Default lists ACTIVE products. ?mine=true lists the farmer's own products
 * (all statuses). Optional ?q= filters by name/location.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const mine = searchParams.get("mine") === "true";
  const q = searchParams.get("q")?.trim().toLowerCase();

  let products;
  if (mine) {
    const roleErr = requireRole(auth.user, ["FARMER", "ADMIN"]);
    if (roleErr) return roleErr;
    products = auth.user.role === "ADMIN" ? await db.products.listActive() : await db.products.listByFarmer(auth.user.id);
  } else {
    products = await db.products.listActive();
  }

  if (q) {
    products = products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q),
    );
  }

  return sendOk({ products: await Promise.all(products.map((p) => productView(p))) });
}