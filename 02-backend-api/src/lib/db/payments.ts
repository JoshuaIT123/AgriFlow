import { pool } from "./pool";
import { buildUpdate, toIso, toNumber, type ColumnDef } from "./utils";
import type { Payment, PaymentStatus } from "../types";

interface PaymentRow {
  id: string;
  trade_id: string;
  payment_request: string;
  payment_hash: string;
  amount_msat: string | number;
  status: PaymentStatus;
  created_at: Date | string;
  paid_at: Date | string | null;
  settled_at: Date | string | null;
}

function rowToPayment(r: PaymentRow): Payment {
  return {
    id: r.id,
    tradeId: r.trade_id,
    paymentRequest: r.payment_request,
    paymentHash: r.payment_hash,
    amountMsat: toNumber(r.amount_msat),
    status: r.status,
    createdAt: toIso(r.created_at),
    paidAt: r.paid_at ? toIso(r.paid_at) : undefined,
    settledAt: r.settled_at ? toIso(r.settled_at) : undefined,
  };
}

const UPDATE_COLUMNS: ColumnDef[] = [
  { col: "status", camel: "status" },
  {
    col: "paid_at",
    camel: "paidAt",
    serialize: (v) => String(v) ?? null,
  },
  {
    col: "settled_at",
    camel: "settledAt",
    serialize: (v) => String(v) ?? null,
  },
];

export class PaymentRepository {
  async create(input: Payment): Promise<Payment> {
    const res = await pool.query(
      `INSERT INTO payments (id, trade_id, payment_request, payment_hash, amount_msat, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        input.id,
        input.tradeId,
        input.paymentRequest,
        input.paymentHash,
        input.amountMsat,
        input.status,
        input.createdAt,
      ],
    );
    return rowToPayment(res.rows[0] as PaymentRow);
  }

  async update(id: string, patch: Partial<Payment>): Promise<Payment | undefined> {
    const q = buildUpdate("payments", id, patch, UPDATE_COLUMNS);
    if (!q) return this.findById(id);
    const res = await pool.query(q.text, q.params);
    return res.rows[0] ? rowToPayment(res.rows[0] as PaymentRow) : undefined;
  }

  async findById(id: string): Promise<Payment | undefined> {
    const res = await pool.query("SELECT * FROM payments WHERE id = $1", [id]);
    return res.rows[0] ? rowToPayment(res.rows[0] as PaymentRow) : undefined;
  }

  /** Payments for a trade, latest first. */
  async findByTrade(tradeId: string): Promise<Payment[]> {
    const res = await pool.query(
      "SELECT * FROM payments WHERE trade_id = $1 ORDER BY created_at DESC",
      [tradeId],
    );
    return (res.rows as PaymentRow[]).map(rowToPayment);
  }
}