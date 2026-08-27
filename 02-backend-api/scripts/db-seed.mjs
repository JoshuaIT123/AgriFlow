import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { clearAll, prisma, run } from "./db.mjs";

/**
 * Demo data: two farmers, one buyer, a spread of Rwandan produce and one
 * pending offer, so a demo opens on a populated marketplace instead of
 * empty screens.
 *
 * Pass --fresh to clear the database first.
 */

const PASSWORD = "demo1234";

const ACCOUNTS = [
  { name: "Mukamana Alice", phone: "+250788000001", role: "FARMER", location: "Musanze" },
  { name: "Uwimana Jean",   phone: "+250788000002", role: "FARMER", location: "Huye" },
  { name: "Cafe du Rift",   phone: "+250788000003", role: "BUYER",  location: "Kigali" },
];

const PRODUCE = [
  { owner: 0, name: "Irish potatoes",     quantity: 500, unit: "kg",    price: 1800,   quality: "Tubers" },
  { owner: 0, name: "Maize",              quantity: 800, unit: "kg",    price: 1200,   quality: "Cereals" },
  { owner: 0, name: "Arabica coffee",     quantity: 120, unit: "kg",    price: 6000,   quality: "Cash crop" },
  { owner: 0, name: "Fresh milk",         quantity: 200, unit: "litre", price: 1400,   quality: "Dairy" },
  { owner: 1, name: "Sweet potatoes",     quantity: 300, unit: "kg",    price: 1500,   quality: "Tubers" },
  { owner: 1, name: "Beans",              quantity: 150, unit: "kg",    price: 2000,   quality: "Legumes" },
  { owner: 1, name: "Improved dairy cow", quantity: 2,   unit: "head",  price: 800000, quality: "Livestock" },
];

run("db:seed", async () => {
  if (process.argv.includes("--fresh")) {
    await clearAll();
    console.log("cleared existing rows\n");
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const users = [];
  for (const acct of ACCOUNTS) {
    // Upsert so re-seeding without --fresh does not collide on phone.
    const user = await prisma.user.upsert({
      where: { phone: acct.phone },
      update: {},
      create: { id: randomUUID(), ...acct, passwordHash, status: "ACTIVE" },
    });
    users.push(user);
    console.log(`user     ${acct.role.padEnd(6)} ${acct.name}  ${acct.phone}`);
  }

  const products = [];
  for (const item of PRODUCE) {
    const { owner, ...rest } = item;
    const product = await prisma.product.create({
      data: {
        id: randomUUID(),
        farmerId: users[owner].id,
        location: ACCOUNTS[owner].location,
        status: "ACTIVE",
        ...rest,
      },
    });
    products.push(product);
    console.log(`product  ${rest.name.padEnd(20)} ${rest.quantity} ${rest.unit} @ ${rest.price} RWF`);
  }

  const coffee = products.find((p) => p.name === "Arabica coffee");
  const buyer = users.find((u) => u.role === "BUYER");
  if (coffee && buyer) {
    const quantity = 100;
    const price = 6200;
    await prisma.offer.create({
      data: {
        id: randomUUID(),
        buyerId: buyer.id,
        productId: coffee.id,
        quantity,
        price,
        // Mirrors the API rule: the server computes money, never the client.
        totalAmount: Math.round(quantity * price * 100) / 100,
        status: "PENDING",
      },
    });
    console.log(`offer    ${buyer.name} -> Arabica coffee, ${quantity}kg @ ${price} RWF`);
  }

  console.log(`\nSign in with any phone above. Password: ${PASSWORD}`);
});
