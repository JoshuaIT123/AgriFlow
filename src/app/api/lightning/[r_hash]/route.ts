import { NextResponse } from "next/server";
import { LndClient, resolveConfig } from "@/lib/lnd";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/lightning/[r_hash] -> { settled, state?, settle_date? , error? }
 *   Polls LND to check whether an invoice (by hex payment hash) is settled.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ r_hash: string }> }
) {
  const { r_hash } = await params;
  if (!/^[0-9a-fA-F]{64}$/.test(r_hash)) {
    return NextResponse.json({ error: "invalid r_hash" }, { status: 400 });
  }
  try {
    const config = resolveConfig();
    const client = new LndClient(config);
    const inv = await client.lookupInvoice(r_hash);
    const settled = !!inv.settled || inv.state === "SETTLED";
    return NextResponse.json({
      settled,
      state: inv.state ?? (settled ? "SETTLED" : "OPEN"),
      settle_date: inv.settle_date ?? 0,
    });
  } catch (e) {
    return NextResponse.json(
      { settled: false, error: e instanceof Error ? e.message : "lookup failed" },
      { status: 502 }
    );
  }
}
