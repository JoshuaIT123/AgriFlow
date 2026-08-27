"use client";

import { useAuth } from "@/lib/auth-context";
import { WalletBoard } from "@/components/WalletBoard";

export default function BuyerWallet() {
  const { user } = useAuth();
  if (!user) return null;
  return <WalletBoard accountId={user.id} />;
}
