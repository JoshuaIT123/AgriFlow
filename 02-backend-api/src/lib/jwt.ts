import jwt from "jsonwebtoken";
import { config } from "./config";
import type { PublicUser } from "./types";

export interface AuthTokenPayload {
  sub: string; // user id
  role: string;
}

export function signToken(user: PublicUser): string {
  const payload: AuthTokenPayload = { sub: user.id, role: user.role };
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(
  token: string,
): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
    if (typeof decoded.sub !== "string") return null;
    return { sub: decoded.sub, role: String(decoded.role) };
  } catch {
    return null;
  }
}