import { prisma } from "../prisma";
import type { User } from "../types";

/**
 * Prisma-backed repository for Users (Postgres via Neon).
 */
export class UserRepository {
  async create(input: Omit<User, "createdAt">): Promise<User> {
    const user = await prisma.user.create({
      data: {
        id: input.id,
        name: input.name,
        phone: input.phone,
        passwordHash: input.passwordHash,
        role: input.role,
        location: input.location,
        status: input.status,
      },
    });
    return this.toUser(user);
  }

  async update(id: string, patch: Partial<User>): Promise<User | undefined> {
    try {
      const user = await prisma.user.update({ where: { id }, data: patch });
      return this.toUser(user);
    } catch {
      return undefined;
    }
  }

  async findById(id: string): Promise<User | undefined> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? this.toUser(user) : undefined;
  }

  async findByPhone(phone: string): Promise<User | undefined> {
    const user = await prisma.user.findUnique({ where: { phone } });
    return user ? this.toUser(user) : undefined;
  }

  async all(): Promise<User[]> {
    const users = await prisma.user.findMany();
    return users.map(this.toUser);
  }

  private toUser(u: any): User {
    return {
      id: u.id,
      name: u.name,
      phone: u.phone,
      passwordHash: u.passwordHash,
      role: u.role,
      location: u.location ?? undefined,
      status: u.status,
      createdAt: u.createdAt.toISOString(),
    };
  }
}

/** Sanitizes a User into the public projection (never exposes passwordHash). */
export function toPublicUser(user: User) {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}
