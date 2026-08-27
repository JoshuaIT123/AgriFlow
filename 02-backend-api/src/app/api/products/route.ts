import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { badRequest, forbidden, sendOk } from "@/lib/http";

export const dynamic = "force-dynamic";

const createProductSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120, "Name too long"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unit: z.string().trim().min(1, "Unit is required").max(20),
  price: z.coerce.number().positive("Price must be greater than 0"),
  location: z.string().trim().min(1, "Location is required").max(200),
  quality: z.string().trim().max(120).optional().default(""),
});

/** POST /api/products - farmer creates a product (UC-06). */
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if ("error" in auth) return auth.error;
  const roleErr = requireRole(auth.user, ["FARMER"]);
  if (roleErr) return roleErr;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());
  const { name, quantity, unit, price, location, quality } = parsed.data;

  const product = db.products.create({
    id: randomUUID(),
    farmerId: auth.user.id,
    name,
    quantity,
    unit,
    price,
    location,
    quality,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  });

  return sendOk({ product }, 201);
}

/**
 * GET /api/products - browse products (UC-07).
 * Default lists ACTIVE products. ?mine=true lists the farmer's own products
 * (all statuses). Optional ?q= filters by name/location.
 */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const mine = searchParams.get("mine") === "true";
  const q = searchParams.get("q")?.trim().toLowerCase();

  let products;
  if (mine) {
    const roleErr = requireRole(auth.user, ["FARMER", "ADMIN"]);
    if (roleErr) return roleErr;
    products = auth.user.role === "ADMIN" ? db.products.listActive() : db.products.listByFarmer(auth.user.id);
  } else {
    products = db.products.listActive();
  }

  if (q) {
    products = products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q),
    );
  }

  return sendOk({ products });
}