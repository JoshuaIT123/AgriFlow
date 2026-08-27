import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { toPublicUser } from "@/lib/db/users";
import { signToken } from "@/lib/jwt";
import { badRequest, sendOk, unauthorized } from "@/lib/http";

export const dynamic = "force-dynamic";

const loginSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(7, "Phone number is too short")
    .max(20, "Phone number is too long")
    .regex(/^\+?[0-9\s\-]+$/, "Invalid phone number format"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  const { phone, password } = parsed.data;

  const user = await db.users.findByPhone(phone);

  // Generic error message on purpose: do not leak whether a phone number
  // exists in the system (prevents user enumeration).
  const INVALID_CREDENTIALS = "Invalid phone number or password";
  if (!user) {
    return unauthorized(INVALID_CREDENTIALS);
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return unauthorized(INVALID_CREDENTIALS);
  }

  const publicUser = toPublicUser(user);
  const token = signToken(publicUser);

  return sendOk({
    user: publicUser,
    accessToken: token,
  });
}