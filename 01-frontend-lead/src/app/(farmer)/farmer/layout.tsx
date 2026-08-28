"use client";

import { LayoutDashboard, Handshake, Receipt, Wallet, Wheat } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import type { PanelTab } from "@/components/PanelShell";

const TABS: PanelTab[] = [
  { href: "/farmer/dashboard", key: "farmer.nav.dashboard", icon: LayoutDashboard, home: true },
  { href: "/farmer/products", key: "farmer.nav.products", icon: Wheat },
  { href: "/farmer/offers", key: "farmer.nav.offers", icon: Handshake },
  { href: "/farmer/payments", key: "farmer.nav.payments", icon: Receipt },
  { href: "/farmer/wallet", key: "farmer.nav.wallet", icon: Wallet },
];

export default function FarmerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard role="farmer" tabs={TABS} roleLabelKey="role.farmer">
      {children}
    </RoleGuard>
  );
}
