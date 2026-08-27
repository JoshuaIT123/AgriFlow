import type { User } from "../types";

/**
 * In-memory repository for Users.
 *
 * NOTE: This is the backend-side data layer so the API is fully testable
 * before the Database/Integration team (Person 4) delivers their schema and
 * queries. The shape here is the contract we hand to them. Swap the internals
 * for real DB calls without changing the route handlers.
 */
export class UserRepository {
  private users = new Map<string, User>();

  create(input: User): User {
    this.users.set(input.id, input);
    return input;
  }

  update(id: string, patch: Partial<User>): User | undefined {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch };
    this.users.set(id, updated);
    return updated;
  }

  findById(id: string): User | undefined {
    return this.users.get(id);
  }

  findByPhone(phone: string): User | undefined {
    for (const user of this.users.values()) {
      if (user.phone === phone) return user;
    }
    return undefined;
  }

  all(): User[] {
    return Array.from(this.users.values());
  }
}

/** Sanitizes a User into the public projection (never exposes passwordHash). */
export function toPublicUser(user: User) {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}