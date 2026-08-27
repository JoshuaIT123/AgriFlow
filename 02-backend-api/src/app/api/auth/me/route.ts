import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { toPublicUser } from "@/lib/db/users";
import { sendOk } from "@/lib/http";

export const dynamic = "force-dynamic";

/** GET /api/auth/me - current authenticated user (UC-03). */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if ("error" in auth) return auth.error;
  return sendOk({ user: toPublicUser(auth.user) });
}