import { config } from "../config";
import type { Trade } from "../types";

export interface PayoutResult {
  paid: boolean;
  paymentHash?: string;
  preimage?: string;
  payeeInvoice?: string;
  payeeNode?: string;
  error?: string;
}

/**
 * Pays the farmer out via the frontend's Lightning service (which holds the
 * LND/Polar credentials). Converts the trade's RWF total to sats using the
 * same msatPerRwf rate as the buyer's escrow invoice.
 */
export async function payFarmer(trade: Trade): Promise<PayoutResult> {
  if (!config.internalServiceKey) {
    return { paid: false, error: "INTERNAL_SERVICE_KEY is not configured" };
  }
  const amountMsat = Math.round(trade.totalAmount * config.msatPerRwf);
  const amountSats = Math.max(1, Math.round(amountMsat / 1000));

  let res: Response;
  try {
    res = await fetch(`${config.lightningServiceUrl}/api/lightning/payout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": config.internalServiceKey,
      },
      body: JSON.stringify({
        tradeId: trade.id,
        amountSats,
        memo: `AgriFlow payout for trade ${trade.id}`,
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (e) {
    return { paid: false, error: e instanceof Error ? e.message : "Payout service unreachable" };
  }

  const body = (await res.json().catch(() => ({}))) as PayoutResult;
  if (!res.ok) {
    return { paid: false, error: body.error ?? `Payout service error (${res.status})` };
  }
  return body;
}
