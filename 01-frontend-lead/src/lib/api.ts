/*
 * HTTP client for the AgriFlow backend (02-backend-api).
 *
 * The backend is the source of truth for users, products, offers and trades.
 * Its vocabulary differs from the UI's (name/quantity/price vs
 * title/quantityKg/pricePerKg), so the mapping into the UI types lives in
 * remote.ts - this file stays a thin transport layer.
 */

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

export interface ApiProduct {
  id: string;
  farmerId: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  location: string;
  quality: string;
  status: "ACTIVE" | "DEACTIVATED";
  createdAt: string;
  farmer?: PublicUser | null;
}

export interface ApiOffer {
  id: string;
  buyerId: string;
  productId: string;
  quantity: number;
  price: number;
  totalAmount: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  product?: { id: string; name: string; unit: string } | null;
  buyer?: PublicUser | null;
  farmer?: PublicUser | null;
}

export type ApiTradeStatus =
  | "NEGOTIATING"
  | "AGREED"
  | "PAYMENT_PENDING"
  | "PAYMENT_LOCKED"
  | "DELIVERY_PENDING"
  | "DELIVERED"
  | "SETTLED"
  | "CANCELLED";

export interface ApiTrade {
  id: string;
  offerId: string;
  buyerId: string;
  farmerId: string;
  productId: string;
  quantity: number;
  agreedPrice: number;
  totalAmount: number;
  status: ApiTradeStatus;
  createdAt: string;
  updatedAt: string;
  product?: { id: string; name: string; unit: string } | null;
  buyer?: PublicUser | null;
  farmer?: PublicUser | null;
  payment?: { id: string; paymentRequest: string; status: string } | null;
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

let token: string | null = null;

export function setToken(value: string | null) {
  token = value;
}

export function getToken(): string | null {
  return token;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init?.headers as Record<string, string>) ?? {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, "Could not reach the server. Check your connection.");
  }

  const body = (await res.json().catch(() => null)) as
    | (Record<string, unknown> & { message?: string })
    | null;
  if (!res.ok) {
    throw new ApiError(res.status, body?.message ?? `Request failed (${res.status})`);
  }
  return body as T;
}

/* ---------------- Auth ---------------- */

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

export function apiMe(): Promise<{ user: PublicUser }> {
  return request<{ user: PublicUser }>("/api/auth/me");
}

/* ---------------- Products ---------------- */

export function apiListProducts(mine = false): Promise<{ products: ApiProduct[] }> {
  return request<{ products: ApiProduct[] }>(
    `/api/products${mine ? "?mine=true" : ""}`,
  );
}

export function apiCreateProduct(input: {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  location: string;
  quality?: string;
}): Promise<{ product: ApiProduct }> {
  return request<{ product: ApiProduct }>("/api/products", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function apiSetProductStatus(
  id: string,
  status: "ACTIVE" | "DEACTIVATED",
): Promise<{ product: ApiProduct }> {
  return request<{ product: ApiProduct }>(`/api/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

/* ---------------- Offers ---------------- */

export function apiMyOffers(): Promise<{ offers: ApiOffer[] }> {
  return request<{ offers: ApiOffer[] }>("/api/offers/my");
}

export function apiReceivedOffers(): Promise<{ offers: ApiOffer[] }> {
  return request<{ offers: ApiOffer[] }>("/api/offers/received");
}

export function apiCreateOffer(input: {
  productId: string;
  quantity: number;
  price: number;
}): Promise<{ offer: ApiOffer }> {
  return request<{ offer: ApiOffer }>("/api/offers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function apiAcceptOffer(id: string): Promise<{ trade: ApiTrade }> {
  return request<{ trade: ApiTrade }>(`/api/offers/${id}/accept`, { method: "POST" });
}

export function apiRejectOffer(id: string): Promise<{ offer: ApiOffer }> {
  return request<{ offer: ApiOffer }>(`/api/offers/${id}/reject`, { method: "POST" });
}

/* ---------------- Trades ---------------- */

export function apiListTrades(): Promise<{ trades: ApiTrade[] }> {
  return request<{ trades: ApiTrade[] }>("/api/trades");
}

export function apiRequestPayment(
  tradeId: string,
): Promise<{ trade: ApiTrade; payment: ApiPayment }> {
  return request(`/api/trades/${tradeId}/payment`, { method: "POST" });
}

export interface ApiPayment {
  id: string;
  tradeId: string;
  paymentRequest: string;
  paymentHash: string;
  amountMsat: number;
  status: "CREATED" | "PENDING" | "PAID" | "FAILED";
  createdAt: string;
  paidAt?: string;
}

/** Polls the backend, which asks LND whether the invoice settled. */
export function apiPaymentStatus(
  paymentId: string,
): Promise<{ payment: ApiPayment; trade: ApiTrade }> {
  return request(`/api/payments/${paymentId}/status`);
}

export function apiConfirmDelivery(tradeId: string): Promise<{ trade: ApiTrade }> {
  return request<{ trade: ApiTrade }>(`/api/trades/${tradeId}/delivery`, {
    method: "POST",
  });
}

export function apiSettleTrade(tradeId: string): Promise<{ trade: ApiTrade }> {
  return request<{ trade: ApiTrade }>(`/api/trades/${tradeId}/settle`, {
    method: "POST",
  });
}

/* ---------------- Predictions ---------------- */

export interface ProductForecast {
  productId: string;
  name: string;
  currentPrice: number;
  suggestedMin: number;
  suggestedMax: number;
  demand: "LOW" | "STEADY" | "HIGH";
  note: string;
}

export interface Predictions {
  generatedAt: string;
  model: string;
  summary: string;
  forecasts: ProductForecast[];
}

/** AI price/demand outlook. The HF token stays server-side on the backend. */
export function apiPredictions(): Promise<{ predictions: Predictions }> {
  return request<{ predictions: Predictions }>("/api/predictions");
}

/* ---------------- Wandaa AI ---------------- */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** In-app support chat. Same HF token stays server-side on the backend. */
export function apiChat(messages: ChatMessage[]): Promise<{ reply: string; model: string }> {
  return request<{ reply: string; model: string }>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ messages }),
  });
}
