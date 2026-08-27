import { NextResponse } from "next/server";
import { LndClient, resolveConfig } from "@/lib/lnd";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/lightning  { amount, memo } -> { rHash, payReq, expirySecs }
 *   Creates a real LND Lightning invoice (via Polar, mirrored from the
 *   Day-4 Lightning Webstore). The user pays it with any Lightning wallet.
 *
 * GET  /api/lightning -> { available, node? , error? }
 *   Returns whether an LND node is reachable (for the UI status badge).
 */
export async function GET() {
  try {
    const config = resolveConfig();
    const client = new LndClient(config);
    if (!client.connected) {
      return NextResponse.json({
        available: false,
        config,
        error: "LND node not found. Start Polar (LND node) and retry.",
      });
    }
    const info = await client.getInfo();
    let balance: number | null = null;
    try {
      const ch = await client.channelBalance();
      const raw = ch.balance ?? ch.local_balance;
      balance = raw != null ? Number(raw) : null;
    } catch {
      balance = null;
    }
    return NextResponse.json({
      available: true,
      node: {
        alias: info.alias || "unknown",
        pubkey: info.identity_pubkey || "",
        channels: info.num_active_channels || 0,
        synced: !!info.synced_to_chain,
        networkName: config.networkName,
        nodeName: config.nodeName,
        balance,
      },
    });
  } catch (e) {
    return NextResponse.json({
      available: false,
      error: e instanceof Error ? e.message : "LND not available",
    });
  }
}

export async function POST(req: Request) {
  let amount: number;
  let memo = "AgriFlow payment";
  try {
    const body = (await req.json()) as { amount?: number; memo?: string };
    amount = Number(body.amount);
    if (body.memo) memo = String(body.memo).slice(0, 200);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "amount must be a positive number (sats)" }, { status: 400 });
  }

  try {
    const config = resolveConfig();
    const client = new LndClient(config);
    const invoice = await client.createInvoice(amount, memo);
    return NextResponse.json(invoice);
  } catch (e) {
    return NextResponse.json(
      {
        error:
          (e instanceof Error ? e.message : "Could not create Lightning invoice") +
          " — is your Polar LND node running?",
      },
      { status: 502 }
    );
  }
}
