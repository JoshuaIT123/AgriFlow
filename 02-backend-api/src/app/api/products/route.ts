import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(2),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  pricePerUnit: z.number().positive(),
});

export async function GET() {
  const products = await prisma.product.findMany({
    include: { farmer: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (authUser.role !== "farmer") {
    return NextResponse.json({ error: "Only farmers can list products" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: { ...parsed.data, farmerId: authUser.sub },
  });

  return NextResponse.json({ product }, { status: 201 });
}
