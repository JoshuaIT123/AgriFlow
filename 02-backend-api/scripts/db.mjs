import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync, readFileSync } from "fs";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Reads DATABASE_URL from the local `.env` file when the env var is absent. */
function defaultUrl() {
  const envPath = join(__dirname, "..", ".env");
  try {
    if (existsSync(envPath)) {
      const match = readFileSync(envPath, "utf8").match(/^DATABASE_URL=(.+)$/m);
      if (match) return match[1].trim();
    }
  } catch {
    /* fall through */
  }
  return "postgres://postgres@localhost:5432/agriflow";
}

export const DATABASE_URL = process.env.DATABASE_URL ?? defaultUrl();

export const SCHEMA_SQL = join(
  __dirname,
  "..",
  "src",
  "lib",
  "db",
  "schema.sql",
);

const { Client } = pg;

export async function connect() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  return client;
}