import { DomainError } from "../errors";
import type { Trade, TradeStatus } from "../types";

/**
 * Trade state machine (UC-19).
 *
 * Normal flow:
 *   NEGOTIATING -> AGREED -> PAYMENT_PENDING -> PAYMENT_LOCKED
 *   -> DELIVERY_PENDING -> DELIVERED -> SETTLED
 *
 * FAILED payments return PAYMENT_PENDING -> AGREED. CANCELLED is terminal.
 * Any non-listed transition is rejected with a 409.
 */
export const TRADE_TRANSITIONS: Record<TradeStatus, readonly TradeStatus[]> = {
  NEGOTIATING: ["AGREED", "CANCELLED"],
  AGREED: ["PAYMENT_PENDING", "CANCELLED"],
  PAYMENT_PENDING: ["PAYMENT_LOCKED", "AGREED", "CANCELLED"],
  PAYMENT_LOCKED: ["DELIVERY_PENDING", "CANCELLED"],
  DELIVERY_PENDING: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["SETTLED"],
  SETTLED: [],
  CANCELLED: [],
};

export function assertTransition(from: TradeStatus, to: TradeStatus): void {
  const allowed = TRADE_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    throw new DomainError(
      409,
      `Invalid trade state transition: ${from} -> ${to}`,
    );
  }
}

/** Returns a new trade with the given status applied and history recorded. */
export function transitionTrade(trade: Trade, to: TradeStatus): Trade {
  assertTransition(trade.status, to);
  const now = new Date().toISOString();
  return {
    ...trade,
    status: to,
    updatedAt: now,
    statusHistory: [...trade.statusHistory, { status: to, at: now }],
  };
}