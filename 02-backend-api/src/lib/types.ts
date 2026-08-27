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

export type ProductStatus = "ACTIVE" | "DEACTIVATED";

export interface Product {
  id: string;
  farmerId: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  location: string;
  quality: string;
  status: ProductStatus;
  createdAt: string;
}

export type OfferStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface Offer {
  id: string;
  buyerId: string;
  productId: string;
  quantity: number;
  /** Unit price the buyer offers (in RWF). */
  price: number;
  /** Backend-computed: quantity * price. */
  totalAmount: number;
  status: OfferStatus;
  createdAt: string;
}

export type TradeStatus =
  | "NEGOTIATING"
  | "AGREED"
  | "PAYMENT_PENDING"
  | "PAYMENT_LOCKED"
  | "DELIVERY_PENDING"
  | "DELIVERED"
  | "SETTLED"
  | "CANCELLED";

export interface TradeStatusEntry {
  status: TradeStatus;
  at: string;
}

export interface Trade {
  id: string;
  offerId: string;
  buyerId: string;
  farmerId: string;
  productId: string;
  quantity: number;
  agreedPrice: number;
  totalAmount: number;
  status: TradeStatus;
  statusHistory: TradeStatusEntry[];
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = "CREATED" | "PENDING" | "PAID" | "FAILED";

export interface Payment {
  id: string;
  tradeId: string;
  /** Lightning payment request string (bolt11 from Person 3; mock for now). */
  paymentRequest: string;
  paymentHash: string;
  amountMsat: number;
  status: PaymentStatus;
  createdAt: string;
  paidAt?: string;
  settledAt?: string;
}