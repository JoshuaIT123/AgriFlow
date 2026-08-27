export const config = {
  jwtSecret: process.env.JWT_SECRET ?? "agriflow-dev-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  /** RWF -> millisatoshis conversion used by the Lightning layer. */
  msatPerRwf: Number(process.env.MSAT_PER_RWF ?? 10),
  /** PostgreSQL connection string. */
  databaseUrl:
    process.env.DATABASE_URL ?? "postgres://postgres@localhost:5432/agriflow",
  /*
   * Hugging Face router credentials for market predictions. The token is a
   * server-only secret: it must never be exposed with a NEXT_PUBLIC_ prefix,
   * or anyone loading the page could spend against it.
   */
  hfToken: process.env.HF_TOKEN ?? "",
  hfModel: process.env.HF_MODEL ?? "openai/gpt-oss-120b:cerebras",
  hfBaseUrl:
    process.env.HF_BASE_URL ?? "https://router.huggingface.co/v1",
};

// Default role allowed at registration. Admin users are seeded/epic not public.
export const REGISTERABLE_ROLES = ["FARMER", "BUYER"] as const;