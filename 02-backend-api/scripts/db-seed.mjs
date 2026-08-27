import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { connect } from "./db.mjs";

const client = await connect();

async function upsertUser(phone, name, role) {
  const res = await client.query("SELECT id FROM users WHERE phone = $1", [phone]);
  if (res.rows.length > 0) {
    console.log(`skip ${phone} (already exists)`);
    return;
  }
  await client.query(
    `INSERT INTO users (id, name, phone, password_hash, role, status, created_at)
     VALUES ($1, $2, $3, $4, $5, 'ACTIVE', now())`,
    [randomUUID(), name, phone, await bcrypt.hash("secret123", 10), role],
  );
  console.log(`seeded ${role} ${name} (${phone})`);
}

try {
  await upsertUser("+250700000001", "Demo Farmer", "FARMER");
  await upsertUser("+250700000002", "Demo Buyer", "BUYER");
  console.log("Seed complete. Login password: secret123");
} finally {
  await client.end();
}