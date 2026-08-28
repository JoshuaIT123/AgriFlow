"use client";

import { LayoutDashboard, Store, Handshake, Receipt, Wallet } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import type { PanelTab } from "@/components/PanelShell";

const TABS: PanelTab[] = [
  { href: "/buyer/dashboard", key: "nav.dashboard", icon: LayoutDashboard, home: true },
  { href: "/buyer/marketplace", key: "mkt.title", icon: Store },
  { href: "/buyer/offers", key: "offer.sent.title", icon: Handshake },
  { href: "/buyer/payments", key: "nav.payments", icon: Receipt },
  { href: "/buyer/wallet", key: "nav.wallet", icon: Wallet },
];

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard role="buyer" tabs={TABS} roleLabelKey="role.buyer">
      {children}
    </RoleGuard>
  );
}
