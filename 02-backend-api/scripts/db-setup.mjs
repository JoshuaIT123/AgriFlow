import { prisma, run } from "./db.mjs";

/**
 * Verifies the database is reachable and reports what is in it.
 * Schema changes are applied with `prisma migrate deploy`, not here.
 */
run("db:setup", async () => {
  const rows = await prisma.$queryRaw`SELECT now() as now`;
  console.log(`connected  ${rows[0].now.toISOString()}`);

  const counts = {
    users: await prisma.user.count(),
    products: await prisma.product.count(),
    offers: await prisma.offer.count(),
    trades: await prisma.trade.count(),
    payments: await prisma.payment.count(),
  };
  for (const [table, n] of Object.entries(counts)) {
    console.log(`  ${table.padEnd(10)} ${n}`);
  }
});
