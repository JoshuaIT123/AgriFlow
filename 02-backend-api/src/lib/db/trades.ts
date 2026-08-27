import { pool } from "./pool";
import { buildUpdate, toIso, toNumber, type ColumnDef } from "./utils";
import type { Trade, TradeStatus, TradeStatusEntry } from "../types";

interface TradeRow {
  id: string;
  offer_id: string;
  buyer_id: string;
  farmer_id: string;
  product_id: string;
  quantity: string | number;
  agreed_price: string | number;
  total_amount: string | number;
  status: TradeStatus;
  status_history: TradeStatusEntry[] | null;
  created_at: Date | string;
  updated_at: Date | string;
}

function rowToTrade(r: TradeRow): Trade {
  return {
    id: r.id,
    offerId: r.offer_id,
    buyerId: r.buyer_id,
    farmerId: r.farmer_id,
    productId: r.product_id,
    quantity: toNumber(r.quantity),
    agreedPrice: toNumber(r.agreed_price),
    totalAmount: toNumber(r.total_amount),
    status: r.status,
    statusHistory: Array.isArray(r.status_history) ? r.status_history : [],
    createdAt: toIso(r.created_at),
    updatedAt: toIso(r.updated_at),
  };
}

const UPDATE_COLUMNS: ColumnDef[] = [
  { col: "status", camel: "status" },
  {
    col: "status_history",
    camel: "statusHistory",
    serialize: (v) => JSON.stringify(v),
  },
  {
    col: "updated_at",
    camel: "updatedAt",
    serialize: (v) => String(v),
  },
];

export class TradeRepository {
  async create(input: Trade): Promise<Trade> {
    const res = await pool.query(
      `INSERT INTO trades (id, offer_id, buyer_id, farmer_id, product_id, quantity, agreed_price, total_amount, status, status_history, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12)
       RETURNING *`,
      [
        input.id,
        input.offerId,
        input.buyerId,
        input.farmerId,
        input.productId,
        input.quantity,
        input.agreedPrice,
        input.totalAmount,
        input.status,
        JSON.stringify(input.statusHistory),
        input.createdAt,
        input.updatedAt,
      ],
    );
    return rowToTrade(res.rows[0] as TradeRow);
  }

  async update(id: string, patch: Partial<Trade>): Promise<Trade | undefined> {
    const q = buildUpdate("trades", id, patch, UPDATE_COLUMNS);
    if (!q) return this.findById(id);
    const res = await pool.query(q.text, q.params);
    return res.rows[0] ? rowToTrade(res.rows[0] as TradeRow) : undefined;
  }

  async findById(id: string): Promise<Trade | undefined> {
    const res = await pool.query("SELECT * FROM trades WHERE id = $1", [id]);
    return res.rows[0] ? rowToTrade(res.rows[0] as TradeRow) : undefined;
  }

  async listForUser(userId: string): Promise<Trade[]> {
    const res = await pool.query(
      "SELECT * FROM trades WHERE buyer_id = $1 OR farmer_id = $1 ORDER BY created_at DESC",
      [userId],
    );
    return (res.rows as TradeRow[]).map(rowToTrade);
  }

  async listByFarmer(farmerId: string): Promise<Trade[]> {
    const res = await pool.query(
      "SELECT * FROM trades WHERE farmer_id = $1 ORDER BY created_at DESC",
      [farmerId],
    );
    return (res.rows as TradeRow[]).map(rowToTrade);
  }

  async listByBuyer(buyerId: string): Promise<Trade[]> {
    const res = await pool.query(
      "SELECT * FROM trades WHERE buyer_id = $1 ORDER BY created_at DESC",
      [buyerId],
    );
    return (res.rows as TradeRow[]).map(rowToTrade);
  }
}