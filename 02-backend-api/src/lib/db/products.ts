import { pool } from "./pool";
import { buildUpdate, toIso, toNumber } from "./utils";
import type { Product, ProductStatus } from "../types";

interface ProductRow {
  id: string;
  farmer_id: string;
  name: string;
  quantity: string | number;
  unit: string;
  price: string | number;
  location: string;
  quality: string;
  status: ProductStatus;
  created_at: Date | string;
}

function rowToProduct(r: ProductRow): Product {
  return {
    id: r.id,
    farmerId: r.farmer_id,
    name: r.name,
    quantity: toNumber(r.quantity),
    unit: r.unit,
    price: toNumber(r.price),
    location: r.location,
    quality: r.quality,
    status: r.status,
    createdAt: toIso(r.created_at),
  };
}

const UPDATE_COLUMNS = [
  { col: "name", camel: "name" },
  { col: "quantity", camel: "quantity" },
  { col: "unit", camel: "unit" },
  { col: "price", camel: "price" },
  { col: "location", camel: "location" },
  { col: "quality", camel: "quality" },
  { col: "status", camel: "status" },
] as const;

export class ProductRepository {
  async create(input: Product): Promise<Product> {
    const res = await pool.query(
      `INSERT INTO products (id, farmer_id, name, quantity, unit, price, location, quality, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        input.id,
        input.farmerId,
        input.name,
        input.quantity,
        input.unit,
        input.price,
        input.location,
        input.quality,
        input.status,
        input.createdAt,
      ],
    );
    return rowToProduct(res.rows[0] as ProductRow);
  }

  async update(id: string, patch: Partial<Product>): Promise<Product | undefined> {
    const q = buildUpdate("products", id, patch, UPDATE_COLUMNS);
    if (!q) return this.findById(id);
    const res = await pool.query(q.text, q.params);
    return res.rows[0] ? rowToProduct(res.rows[0] as ProductRow) : undefined;
  }

  async findById(id: string): Promise<Product | undefined> {
    const res = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
    return res.rows[0] ? rowToProduct(res.rows[0] as ProductRow) : undefined;
  }

  async listActive(): Promise<Product[]> {
    const res = await pool.query(
      "SELECT * FROM products WHERE status = 'ACTIVE' ORDER BY created_at DESC",
    );
    return (res.rows as ProductRow[]).map(rowToProduct);
  }

  async listByFarmer(farmerId: string): Promise<Product[]> {
    const res = await pool.query(
      "SELECT * FROM products WHERE farmer_id = $1 ORDER BY created_at DESC",
      [farmerId],
    );
    return (res.rows as ProductRow[]).map(rowToProduct);
  }
}