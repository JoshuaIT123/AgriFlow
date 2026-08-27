import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tradeId = parseInt(params.id, 10);
  const trade = await prisma.trade.findUnique({
    where: { id: tradeId },
    include: { offer: { include: { product: true } }, buyer: { select: { id: true, name: true } } },
  });

  if (!trade) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  const isBuyer = trade.buyerId === authUser.sub;
  const isFarmer = trade.offer.product.farmerId === authUser.sub;
  if (!isBuyer && !isFarmer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ trade });
}
