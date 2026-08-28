export type Locale = "en" | "rw";
export type Role = "farmer" | "buyer";

export type Currency = "RWF";

// Selling unit for a product. Livestock/dairy use non-kg units (per head,
// per litre, per crate, etc.), while field crops use kilograms.
export type Unit = "kg" | "head" | "litre" | "unit" | "crate" | "dozen" | "bunch";

export type ProductStatus = "available" | "sold";
export type DealStatus =
  | "pending_delivery"
  | "released"
  | "confirmed"
  | "auto_released";
export type OfferStatus = "pending" | "accepted" | "rejected";
export type WalletTxType = "credit" | "debit";
export type WalletTxStatus = "settled" | "pending";

export interface Account {
  id: string;
  name: string;
  phone: string;
  mobileMoney: string; // network key e.g. "MTN"
  role: Role;
  locale: Locale;
  createdAt: string;
}

export interface Product {
  id: string;
  farmerId: string;
  farmerName: string;
  title: string;
  category: string;
  quantityKg: number;
  pricePerKg: number;
  unit?: Unit; // defaults to "kg" when absent (backward compatible)
  currency: Currency;
  status: ProductStatus;
  createdAt: string;
}

export interface Offer {
  id: string;
  productId: string;
  buyerId: string;
  buyerName: string;
  pricePerKg: number;
  quantityKg: number;
  unit?: Unit;
  currency: Currency;
  message?: string;
  status: OfferStatus;
  createdAt: string;
}

export interface Deal {
  id: string;
  productId: string;
  offerId: string;
  farmerId: string;
  farmerName: string;
  buyerId: string;
  buyerName: string;
  productTitle: string;
  quantityKg: number;
  unit?: Unit;
  amountRwf: number;
  currency: Currency;
  status: DealStatus;
  autoReleaseInHours: number;
  createdAt: string;
  confirmedAt?: string | null;
  releasedAt?: string | null;
  hasConditionalSettlement: boolean;
  /**
   * Raw backend trade status. DealStatus collapses the eight-state machine
   * into four, which loses the distinction the payment screen needs: whether
   * this trade is still awaiting payment.
   */
  tradeStatus?: string;
}

export interface WalletTxn {
  id: string;
  accountId: string;
  kind: WalletTxType;
  amount: number;
  currency: Currency;
  status: WalletTxStatus;
  note: string;
  createdAt: string;
}

export type ArrangementStatus = "active" | "paused" | "archived";

export interface BuyerArrangement {
  id: string;
  farmerId: string;
  buyer: string;
  item: string;
  pricePerKg: number;
  currency: Currency;
  cadence: "monthly" | "seasonal";
  status: ArrangementStatus;
  createdAt: string;
  nextCycle: string;
  totalCycles: number;
  completedCycles: number;
}
