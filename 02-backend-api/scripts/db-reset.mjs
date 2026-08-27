import { clearAll, prisma, run } from "./db.mjs";

/**
 * Empties every table. Destructive, so it refuses to run without --yes:
 * db:reset sits one keystroke away from db:seed.
 */
run("db:reset", async () => {
  if (!process.argv.includes("--yes")) {
    console.log("This deletes ALL rows in the database.");
    console.log("Re-run to confirm:  npm run db:reset -- --yes");
    return;
  }
  const before = await prisma.user.count();
  await clearAll();
  console.log(`cleared (was ${before} users)`);
});
