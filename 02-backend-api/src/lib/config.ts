export const config = {
  jwtSecret: process.env.JWT_SECRET ?? "agriflow-dev-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
};

// Default role allowed at registration. Admin users are seeded/epic not public.
export const REGISTERABLE_ROLES = ["FARMER", "BUYER"] as const;