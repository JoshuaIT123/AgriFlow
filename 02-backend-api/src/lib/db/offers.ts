import { pool } from "./pool";
import { buildUpdate, toIso, toNumber } from "./utils";
import type { Offer, OfferStatus } from "../types";

interface OfferRow {
  id: string;
  buyer_id: string;
  product_id: string;
  quantity: string | number;
  price: string | number;
  total_amount: string | number;
  status: OfferStatus;
  created_at: Date | string;
}

function rowToOffer(r: OfferRow): Offer {
  return {
    id: r.id,
    buyerId: r.buyer_id,
    productId: r.product_id,
    quantity: toNumber(r.quantity),
    price: toNumber(r.price),
    totalAmount: toNumber(r.total_amount),
    status: r.status,
    createdAt: toIso(r.created_at),
  };
}

const UPDATE_COLUMNS = [
  { col: "buyer_id", camel: "buyerId" },
  { col: "product_id", camel: "productId" },
  { col: "quantity", camel: "quantity" },
  { col: "price", camel: "price" },
  { col: "total_amount", camel: "totalAmount" },
  { col: "status", camel: "status" },
] as const;

export class OfferRepository {
  async create(input: Offer): Promise<Offer> {
    const res = await pool.query(
      `INSERT INTO offers (id, buyer_id, product_id, quantity, price, total_amount, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        input.id,
        input.buyerId,
        input.productId,
        input.quantity,
        input.price,
        input.totalAmount,
        input.status,
        input.createdAt,
      ],
    );
    return rowToOffer(res.rows[0] as OfferRow);
  }

  async update(id: string, patch: Partial<Offer>): Promise<Offer | undefined> {
    const q = buildUpdate("offers", id, patch, UPDATE_COLUMNS);
    if (!q) return this.findById(id);
    const res = await pool.query(q.text, q.params);
    return res.rows[0] ? rowToOffer(res.rows[0] as OfferRow) : undefined;
  }

  async findById(id: string): Promise<Offer | undefined> {
    const res = await pool.query("SELECT * FROM offers WHERE id = $1", [id]);
    return res.rows[0] ? rowToOffer(res.rows[0] as OfferRow) : undefined;
  }

  async listByBuyer(buyerId: string): Promise<Offer[]> {
    const res = await pool.query(
      "SELECT * FROM offers WHERE buyer_id = $1 ORDER BY created_at DESC",
      [buyerId],
    );
    return (res.rows as OfferRow[]).map(rowToOffer);
  }

  /** Offers received for a farmer's set of product ids. */
  async listForProducts(productIds: readonly string[]): Promise<Offer[]> {
    if (productIds.length === 0) return [];
    const res = await pool.query(
      `SELECT * FROM offers WHERE product_id = ANY($1::uuid[]) ORDER BY created_at DESC`,
      [productIds],
    );
    return (res.rows as OfferRow[]).map(rowToOffer);
  }
}