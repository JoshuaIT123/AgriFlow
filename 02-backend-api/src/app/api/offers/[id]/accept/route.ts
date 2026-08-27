import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (authUser.role !== "farmer") {
    return NextResponse.json({ error: "Only farmers can accept offers" }, { status: 403 });
  }

  const offerId = parseInt(params.id, 10);
  const offer = await prisma.offer.findUnique({ include: { product: true }, where: { id: offerId } });
  if (!offer) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }
  if (offer.product.farmerId !== authUser.sub) {
    return NextResponse.json({ error: "Not your product" }, { status: 403 });
  }
  if (offer.status !== "pending") {
    return NextResponse.json({ error: "Offer already resolved" }, { status: 409 });
  }

  const [updatedOffer, trade] = await prisma.$transaction([
    prisma.offer.update({ where: { id: offerId }, data: { status: "accepted" } }),
    prisma.trade.create({
      data: { offerId: offerId, buyerId: offer.buyerId, status: "pending_payment" },
    }),
  ]);

  return NextResponse.json({ offer: updatedOffer, trade });
}
