export type BackendRole = "FARMER" | "BUYER" | "ADMIN";

export interface PublicUser {
  id: string;
  name: string;
  phone: string;
  role: BackendRole;
  location?: string;
  status: "ACTIVE" | "DEACTIVATED";
  createdAt: string;
}

export interface AuthResponse {
  user: PublicUser;
  accessToken: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(0, "Could not reach the server. Check your connection.");
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, body?.message ?? "Request failed");
  }
  return body as T;
}

export function apiRegister(input: {
  name: string;
  phone: string;
  password: string;
  role: "FARMER" | "BUYER";
  location?: string;
}): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function apiLogin(input: {
  phone: string;
  password: string;
}): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function apiMe(token: string): Promise<{ user: PublicUser }> {
  return request<{ user: PublicUser }>("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}
