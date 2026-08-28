import { createHash } from "crypto";
import { LndClient, resolveConfig } from "@/lib/lnd";

/**
 * LIGHTNING BOUNDARY (backend-side contract).
 * Routes depend only on this interface.
 */
export interface CreateInvoiceInput {
  tradeId: string;
  amountMsat: number;
  memo: string;
}
export interface InvoiceResult {
  paymentRequest: string;
  paymentHash: string;
  expiresAt: string;
}
export interface PaymentStatusResult {
  paid: boolean;
  failed: boolean;
  settledAt?: string;
}
export interface LightningService {
  createInvoice(input: CreateInvoiceInput): Promise<InvoiceResult>;
  checkPayment(paymentHash: string): Promise<PaymentStatusResult>;
}

type MockMode = "autopay" | "manual" | "fail";

/** Demo mock - used when LIGHTNING_BACKEND is not "real" or LND is unreachable. */
export class MockLightningService implements LightningService {
  private mode: MockMode;
  constructor(
    mode: MockMode = ((process.env.LIGHTNING_MOCK_MODE as MockMode) ?? "autopay"),
  ) {
    this.mode = mode;
  }
  async createInvoice(input: CreateInvoiceInput): Promise<InvoiceResult> {
    const paymentHash = createHash("sha256")
      .update(`${input.tradeId}:${input.amountMsat}:${input.memo}:${Date.now()}`)
      .digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const paymentRequest = `lnbcrt${input.amountMsat}m_${paymentHash.slice(0, 20)}_agriflowmock`;
    return { paymentRequest, paymentHash, expiresAt };
  }
  async checkPayment(_paymentHash: string): Promise<PaymentStatusResult> {
    switch (this.mode) {
      case "fail":
        return { paid: false, failed: true };
      case "manual":
        return { paid: false, failed: false };
      default:
        return { paid: true, settledAt: new Date().toISOString(), failed: false };
    }
  }
}

/** Real LND-backed implementation (REST via Polar or a hosted node). */
export class RealLightningService implements LightningService {
  async createInvoice(input: CreateInvoiceInput): Promise<InvoiceResult> {
    const config = resolveConfig();
    const client = new LndClient(config);
    if (!client.connected) {
      throw new Error(
        "LND not reachable. Start Polar (LND node) or set LND_MACAROON_HEX/REST_HOST."
      );
    }
    // LND REST expects sats, our trade amounts are tracked in msat.
    const amountSats = Math.round(input.amountMsat / 1000);
    const inv = await client.createInvoice(amountSats, input.memo);
    const expiresAt = new Date(Date.now() + inv.expirySecs * 1000).toISOString();
    return {
      paymentRequest: inv.payReq,
      paymentHash: inv.rHash,
      expiresAt,
    };
  }
  async checkPayment(paymentHash: string): Promise<PaymentStatusResult> {
    const config = resolveConfig();
    const client = new LndClient(config);
    if (!client.connected) {
      return { paid: false, failed: false };
    }
    try {
      const inv = await client.lookupInvoice(paymentHash);
      const settled = !!inv.settled || inv.state === "SETTLED";
      return {
        paid: settled,
        failed: false,
        settledAt: settled && inv.settle_date
          ? new Date(Number(inv.settle_date) * 1000).toISOString()
          : undefined,
      };
    } catch {
      return { paid: false, failed: false };
    }
  }
}

/**
 * Singleton used by route handlers.
 * Set LIGHTNING_BACKEND=real in env to use the real LND-backed service;
 * defaults to the mock so the demo still works if LND isn't running.
 */
export const lightning: LightningService =
  process.env.LIGHTNING_BACKEND === "real"
    ? new RealLightningService()
    : new MockLightningService();
