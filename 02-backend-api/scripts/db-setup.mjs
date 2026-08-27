import { readFileSync } from "fs";
import { connect, SCHEMA_SQL, DATABASE_URL } from "./db.mjs";

console.log(`Applying schema to ${DATABASE_URL}`);
const client = await connect();
try {
  const sql = readFileSync(SCHEMA_SQL, "utf8");
  await client.query(sql);
  console.log("Schema applied.");
} finally {
  await client.end();
}