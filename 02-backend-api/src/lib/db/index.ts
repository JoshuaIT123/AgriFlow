import { UserRepository } from "./users";

/**
 * Central application data access.
 * Repositories are singletons seeded per-process. In a real DB world these
 * would wrap connection pools / query builders from the Database team.
 */
export const db = {
  users: new UserRepository(),
};

/** Resets all repositories (used for tests / seeding a fresh demo). */
export function resetDb(): void {
  db.users = new UserRepository();
}