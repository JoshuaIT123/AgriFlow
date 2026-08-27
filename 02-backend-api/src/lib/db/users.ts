import { pool } from "./pool";
import { buildUpdate, toIso } from "./utils";
import type { User, Role, UserStatus } from "../types";

interface UserRow {
  id: string;
  name: string;
  phone: string;
  password_hash: string;
  role: Role;
  location: string | null;
  status: UserStatus;
  created_at: Date | string;
}

function rowToUser(r: UserRow): User {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    passwordHash: r.password_hash,
    role: r.role,
    location: r.location ?? undefined,
    status: r.status,
    createdAt: toIso(r.created_at),
  };
}

const UPDATE_COLUMNS = [
  { col: "name", camel: "name" },
  { col: "phone", camel: "phone" },
  { col: "password_hash", camel: "passwordHash" },
  { col: "role", camel: "role" },
  { col: "location", camel: "location" },
  { col: "status", camel: "status" },
] as const;

export class UserRepository {
  async create(input: User): Promise<User> {
    const res = await pool.query(
      `INSERT INTO users (id, name, phone, password_hash, role, location, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        input.id,
        input.name,
        input.phone,
        input.passwordHash,
        input.role,
        input.location ?? null,
        input.status,
        input.createdAt,
      ],
    );
    return rowToUser(res.rows[0] as UserRow);
  }

  async update(id: string, patch: Partial<User>): Promise<User | undefined> {
    const q = buildUpdate("users", id, patch, UPDATE_COLUMNS);
    if (!q) return this.findById(id);
    const res = await pool.query(q.text, q.params);
    return res.rows[0] ? rowToUser(res.rows[0] as UserRow) : undefined;
  }

  async findById(id: string): Promise<User | undefined> {
    const res = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    return res.rows[0] ? rowToUser(res.rows[0] as UserRow) : undefined;
  }

  async findByPhone(phone: string): Promise<User | undefined> {
    const res = await pool.query("SELECT * FROM users WHERE phone = $1", [phone]);
    return res.rows[0] ? rowToUser(res.rows[0] as UserRow) : undefined;
  }

  async all(): Promise<User[]> {
    const res = await pool.query("SELECT * FROM users ORDER BY created_at DESC");
    return (res.rows as UserRow[]).map(rowToUser);
  }
}

/** Sanitizes a User into the public projection (never exposes passwordHash). */
export function toPublicUser(user: User) {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}