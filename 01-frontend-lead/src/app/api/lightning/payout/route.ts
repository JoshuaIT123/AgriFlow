import { NextResponse } from "next/server";
import { LndClient, resolveConfig, resolveNamedConfig } from "@/lib/lnd";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/lightning/payout  { tradeId, amountSats, memo }
 *   Internal-service-only (checked via x-internal-key). Called by the
 *   backend when a trade settles. Auto-generates an invoice on the farmer
 *   stand-in node (default: carol) and pays it from alice's node, so a
 *   payout actually moves sats instead of just flipping a status.
 */
export async function POST(req: Request) {
  const expected = process.env.INTERNAL_SERVICE_KEY;
  if (!expected) {
    return NextResponse.json({ error: "INTERNAL_SERVICE_KEY is not configured" }, { status: 500 });
  }
  if (req.headers.get("x-internal-key") !== expected) {
    return NextResponse.json({ error: "Invalid internal service key" }, { status: 401 });
  }

  let amountSats: number;
  let memo = "AgriFlow farmer payout";
  let tradeId = "";
  try {
    const body = (await req.json()) as { amountSats?: number; memo?: string; tradeId?: string };
    amountSats = Number(body.amountSats);
    if (body.memo) memo = String(body.memo).slice(0, 200);
    if (body.tradeId) tradeId = String(body.tradeId).slice(0, 64);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!Number.isFinite(amountSats) || amountSats <= 0) {
    return NextResponse.json({ error: "amountSats must be a positive number" }, { status: 400 });
  }

  const farmerNode = process.env.FARMER_NODE_NAME ?? "carol";

  try {
    const payeeConfig = resolveNamedConfig(farmerNode);
    const payeeClient = new LndClient(payeeConfig);
    const invoice = await payeeClient.createInvoice(amountSats, memo);

    const payerConfig = resolveConfig("alice");
    const payerClient = new LndClient(payerConfig);
    const result = await payerClient.payInvoice(invoice.payReq);

    if (!result.paid) {
      return NextResponse.json(
        { paid: false, error: result.error ?? "Payment failed", payeeInvoice: invoice.payReq, payeeNode: farmerNode, tradeId },
        { status: 502 }
      );
    }

    return NextResponse.json({
      paid: true,
      paymentHash: result.paymentHash,
      preimage: result.preimage,
      payeeInvoice: invoice.payReq,
      payeeNode: farmerNode,
      tradeId,
    });
  } catch (e) {
    return NextResponse.json(
      { paid: false, error: e instanceof Error ? e.message : "Payout failed" },
      { status: 502 }
    );
  }
}
