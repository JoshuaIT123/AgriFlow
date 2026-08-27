export type Role = "FARMER" | "BUYER" | "ADMIN";

export type UserStatus = "ACTIVE" | "DEACTIVATED";

export interface User {
  id: string;
  name: string;
  phone: string;
  /** Hashed password, never returned to clients */
  passwordHash: string;
  role: Role;
  location?: string;
  status: UserStatus;
  createdAt: string;
}

/** Public projection of a User - safe to send to clients. */
export type PublicUser = Omit<User, "passwordHash">;