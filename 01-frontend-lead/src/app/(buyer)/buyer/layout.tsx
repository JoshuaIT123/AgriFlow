"use client";

import { RoleGuard } from "@/components/RoleGuard";
import type { PanelTab } from "@/components/PanelShell";

const TABS: PanelTab[] = [
  { href: "/buyer/dashboard", key: "nav.dashboard", icon: "🏠", home: true },
  { href: "/buyer/marketplace", key: "mkt.title", icon: "🛒" },
  { href: "/buyer/offers", key: "offer.sent.title", icon: "🤝" },
  { href: "/buyer/payments", key: "nav.payments", icon: "💸" },
  { href: "/buyer/wallet", key: "nav.wallet", icon: "👛" },
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
