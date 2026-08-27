import jwt from "jsonwebtoken";

export interface AuthUser {
  sub: number;
  role: "farmer" | "buyer";
}

export function getAuthUser(req: Request): AuthUser | null {
  const header = req.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.slice(7);
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    return jwt.verify(token, secret) as unknown as AuthUser;
  } catch {
    return null;
  }
}
