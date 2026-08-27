"use client";

import { RoleGuard } from "@/components/RoleGuard";
import type { PanelTab } from "@/components/PanelShell";

const TABS: PanelTab[] = [
  { href: "/farmer/dashboard", key: "farmer.nav.dashboard", icon: "🏠", home: true },
  { href: "/farmer/products", key: "farmer.nav.products", icon: "🌾" },
  { href: "/farmer/offers", key: "farmer.nav.offers", icon: "🤝" },
  { href: "/farmer/payments", key: "farmer.nav.payments", icon: "💸" },
  { href: "/farmer/wallet", key: "farmer.nav.wallet", icon: "👛" },
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
