export const config = {
  jwtSecret: process.env.JWT_SECRET ?? "agriflow-dev-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  msatPerRwf: Number(process.env.MSAT_PER_RWF ?? 10),
  databaseUrl:
    process.env.DATABASE_URL ?? "postgres://postgres@localhost:5432/agriflow",
  hfToken: process.env.HF_TOKEN ?? "",
  hfModel: process.env.HF_MODEL ?? "openai/gpt-oss-120b:cerebras",
  hfBaseUrl:
    process.env.HF_BASE_URL ?? "https://router.huggingface.co/v1",
  internalServiceKey: process.env.INTERNAL_SERVICE_KEY ?? "",
  lightningServiceUrl:
    process.env.LIGHTNING_SERVICE_URL ?? "https://agriflow-btc.vercel.app",
};

export const REGISTERABLE_ROLES = ["FARMER", "BUYER"] as const;
