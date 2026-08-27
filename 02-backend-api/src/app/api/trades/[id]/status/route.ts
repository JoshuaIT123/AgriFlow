import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  status: z.enum(["payment_confirmed", "delivered", "settled", "cancelled"]),
  invoiceId: z.string().optional(),
  paymentReq: z.string().optional(),
});

// Called by the Lightning layer (internal service-to-service, not end-user auth)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const internalKey = req.headers.get("x-internal-key");
  if (internalKey !== process.env.INTERNAL_SERVICE_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tradeId = parseInt(params.id, 10);
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const trade = await prisma.trade.findUnique({ where: { id: tradeId } });
  if (!trade) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  const updated = await prisma.trade.update({
    where: { id: tradeId },
    data: parsed.data,
  });

  return NextResponse.json({ trade: updated });
}
