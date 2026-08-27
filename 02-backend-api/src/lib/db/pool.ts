import { Pool } from "pg";
import { config } from "../config";

/**
 * Single connection pool used by all repositories.
 * Reuse across the process; `pg` handles connection lifecycle.
 */
export const pool = new Pool({ connectionString: config.databaseUrl });