import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { toPublicUser } from "@/lib/db/users";
import { REGISTERABLE_ROLES } from "@/lib/config";
import { signToken } from "@/lib/jwt";
import { badRequest, conflict, sendOk } from "@/lib/http";

export const dynamic = "force-dynamic";

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
  phone: z
    .string()
    .trim()
    .min(7, "Phone number is too short")
    .max(20, "Phone number is too long")
    .regex(/^\+?[0-9\s\-]+$/, "Invalid phone number format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(REGISTERABLE_ROLES, {
    errorMap: () => ({ message: "Role must be FARMER or BUYER" }),
  }),
  location: z.string().trim().max(200, "Location too long").optional().default(""),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  const { name, phone, password, role, location } = parsed.data;

  // Business rule: phone numbers are unique identifiers for login.
  if (await db.users.findByPhone(phone)) {
    return conflict("A user with this phone number already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.users.create({
    id: randomUUID(),
    name,
    phone,
    passwordHash,
    role,
    location: location || undefined,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  });

  const publicUser = toPublicUser(user);
  const token = signToken(publicUser);

  return sendOk(
    {
      user: publicUser,
      accessToken: token,
    },
    201,
  );
}