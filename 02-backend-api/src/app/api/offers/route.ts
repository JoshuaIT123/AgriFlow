import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

const schema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().positive(),
  price: z.number().positive(),
});

export async function POST(req: Request) {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (authUser.role !== "buyer") {
    return NextResponse.json({ error: "Only buyers can make offers" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const offer = await prisma.offer.create({
    data: { ...parsed.data, buyerId: authUser.sub },
  });

  return NextResponse.json({ offer }, { status: 201 });
}

export async function GET(req: Request) {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const offers = await prisma.offer.findMany({
    where:
      authUser.role === "buyer"
        ? { buyerId: authUser.sub }
        : { product: { farmerId: authUser.sub } },
    include: { product: true, buyer: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ offers });
}
