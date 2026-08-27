import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { toPublicUser } from "@/lib/db/users";
import { badRequest, conflict, forbidden, notFound, sendOk } from "@/lib/http";

export const dynamic = "force-dynamic";

/** GET /api/users/:id - view profile (UC-04). */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = requireAuth(_request);
  if ("error" in auth) return auth.error;

  const user = db.users.findById(params.id);
  if (!user) return notFound("User not found");

  return sendOk({ user: toPublicUser(user) });
}

const updateUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100).optional(),
  location: z.string().trim().max(200).optional(),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(20)
    .regex(/^\+?[0-9\s\-]+$/, "Invalid phone number format")
    .optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

/** PATCH /api/users/:id - update own profile (UC-05). Role is immutable. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = requireAuth(request);
  if ("error" in auth) return auth.error;

  // Only the account owner (or an ADMIN) may update a profile.
  if (auth.user.role !== "ADMIN" && auth.user.id !== params.id) {
    return forbidden("You can only update your own profile");
  }

  const target = db.users.findById(params.id);
  if (!target) return notFound("User not found");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());
  const { name, location, phone, password } = parsed.data;

  if (phone !== undefined && phone !== target.phone) {
    const existing = db.users.findByPhone(phone);
    if (existing && existing.id !== target.id) {
      return conflict("This phone number is already in use");
    }
  }

  const updated = db.users.update(params.id, {
    ...(name !== undefined ? { name } : {}),
    ...(location !== undefined ? { location: location || undefined } : {}),
    ...(phone !== undefined ? { phone } : {}),
    ...(password !== undefined
      ? { passwordHash: await bcrypt.hash(password, 10) }
      : {}),
  });

  if (!updated) return notFound("User not found");
  return sendOk({ user: toPublicUser(updated) });
}