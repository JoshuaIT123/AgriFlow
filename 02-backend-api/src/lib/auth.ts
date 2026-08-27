import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./jwt";
import { db } from "./db";
import { forbidden, unauthorized } from "./http";
import type { Role, Trade, User } from "./types";

export type AuthResult = { user: User } | { error: NextResponse };

export function getRequestToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const [scheme, token, ...rest] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token || rest.length > 0) return null;
  return token;
}

/** Validates the Bearer token and returns the authenticated user. */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const token = getRequestToken(request);
  if (!token) return { error: unauthorized("Authentication required") };

  const payload = verifyToken(token);
  if (!payload) return { error: unauthorized("Invalid or expired token") };

  const user = await db.users.findById(payload.sub);
  if (!user) return { error: unauthorized("User not found") };

  return { user };
}

/** Restricts a route to certain roles. Returns null when allowed. */
export function requireRole(
  user: User,
  roles: readonly Role[],
): NextResponse | null {
  if (roles.includes(user.role)) return null;
  return forbidden(`Requires role: ${roles.join(" or ")}`);
}

/** Participants (buyer/farmer) plus ADMIN may access a trade. */
export function canAccessTrade(user: User, trade: Trade): boolean {
  return user.role === "ADMIN" || user.id === trade.buyerId || user.id === trade.farmerId;
}