import { PrismaClient } from "@prisma/client";

/**
 * Shared Prisma handle for the db:* scripts.
 *
 * These talk to the same Neon database and schema the API uses, so a seeded
 * row is indistinguishable from one the app itself wrote.
 */
export const prisma = new PrismaClient();

/** Runs a script body, reports failure clearly, and always disconnects. */
export async function run(label, fn) {
  const started = Date.now();
  try {
    await fn();
    console.log(`\n${label} completed in ${Date.now() - started}ms`);
  } catch (err) {
    console.error(`\n${label} FAILED:`);
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

/** Children before parents, so foreign keys stay satisfied. */
export async function clearAll() {
  await prisma.payment.deleteMany();
  await prisma.tradeStatusEntry.deleteMany();
  await prisma.trade.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
}
