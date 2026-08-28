import { NextResponse } from "next/server";
import { LndClient, resolveConfig, resolveNamedConfig } from "@/lib/lnd";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/lightning/demo-pay  { payReq } -> { paid, preimage? }
 *
 * Pays an invoice from a stand-in buyer node so a presentation does not need
 * a terminal. This is a demo affordance for a local regtest network, not a
 * payment feature: on a real deployment the payer is the person's own wallet.
 *
 * It refuses to pay anything our own escrow node did not issue. Without that
 * check, this route - reachable by anyone who has the demo URL - would pay
 * arbitrary invoices and drain the payer node.
 */
export async function POST(req: Request) {
  let payReq: string;
  try {
    const body = (await req.json()) as { payReq?: string };
    payReq = String(body.payReq ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payReq) {
    return NextResponse.json({ error: "payReq is required" }, { status: 400 });
  }

  try {
    const escrow = new LndClient(resolveConfig());
    if (!escrow.connected) {
      return NextResponse.json(
        { error: "Escrow node unavailable. Is Polar running?" },
        { status: 502 },
      );
    }

    // Only invoices issued by our own node may be auto-paid.
    const decoded = await escrow.decodePayReq(payReq);
    const hash = decoded.payment_hash;
    if (!hash) {
      return NextResponse.json({ error: "Could not decode invoice" }, { status: 400 });
    }
    const invoice = await escrow.lookupInvoice(hash).catch(() => null);
    if (!invoice) {
      return NextResponse.json(
        { error: "Refusing to pay an invoice this node did not issue" },
        { status: 403 },
      );
    }
    if (invoice.settled || invoice.state === "SETTLED") {
      return NextResponse.json({ paid: true, alreadySettled: true });
    }

    const payerName = process.env.DEMO_PAYER_NODE ?? "carol";
    const payer = new LndClient(resolveNamedConfig(payerName));
    if (!payer.connected) {
      return NextResponse.json(
        { error: `Payer node "${payerName}" unavailable` },
        { status: 502 },
      );
    }

    const res = await payer.payInvoice(payReq);
    if (!res.paid) {
      return NextResponse.json(
        { paid: false, error: res.error ?? "Payment failed" },
        { status: 502 },
      );
    }
    return NextResponse.json({ paid: true, preimage: res.preimage, payer: payerName });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Auto-pay failed" },
      { status: 502 },
    );
  }
}
