import { connect } from "./db.mjs";

const client = await connect();
try {
  await client.query(
    "TRUNCATE payments, trades, offers, products, users RESTART IDENTITY CASCADE",
  );
  console.log("Database reset.");
} finally {
  await client.end();
}