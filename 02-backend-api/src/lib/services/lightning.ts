import { createHash } from "crypto";

/**
 * LIGHTNING BOUNDARY (backend-side contract).
 *
 * THIS IS NOT THE LIGHTNING IMPLEMENTATION. Person 3 (Lightning Engineer)
 * owns LND / Polar / invoice verification. Routes depend ONLY on this
 * interface, so swapping the mock for the real service is a one-line change
 * and does not touch any route code.
 */

export interface CreateInvoiceInput {
  tradeId: string;
  amountMsat: number;
  memo: string;
}

export interface InvoiceResult {
  /** bolt11 / payment-request string shown as QR to the buyer. */
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

/**
 * Demo mock standing in for the Lightning layer until Person 3 ships.
 * Modes (env LIGHTNING_MOCK_MODE):
 *   autopay (default) - payment is "confirmed" on first status check
 *   manual            - always pending (never pays)
 *   fail              - always fails   (exercises UC-23)
 */
export class MockLightningService implements LightningService {
  private mode: MockMode;

  constructor(
    mode: MockMode =
      ((process.env.LIGHTNING_MOCK_MODE as MockMode) ?? "autopay"),
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

/** Singleton used by route handlers. Swap for the real LND-backed impl later. */
export const lightning: LightningService = new MockLightningService();