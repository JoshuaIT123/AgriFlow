"use client";

import {
  LayoutDashboard,
  Handshake,
  MessageCircle,
  Receipt,
  Wallet,
  Wheat,
} from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import type { PanelTab } from "@/components/PanelShell";
import { useAuth } from "@/lib/auth-context";
import { useStoreVersion } from "@/lib/store-bus";
import { getUnreadChatCount } from "@/lib/store";

export default function FarmerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  useStoreVersion();

  const tabs: PanelTab[] = [
    { href: "/farmer/dashboard", key: "farmer.nav.dashboard", icon: LayoutDashboard, home: true },
    { href: "/farmer/products", key: "farmer.nav.products", icon: Wheat },
    { href: "/farmer/offers", key: "farmer.nav.offers", icon: Handshake },
    {
      href: "/chat",
      key: "nav.messages",
      icon: MessageCircle,
      badge: user ? getUnreadChatCount(user.id) : 0,
    },
    { href: "/farmer/payments", key: "farmer.nav.payments", icon: Receipt },
    { href: "/farmer/wallet", key: "farmer.nav.wallet", icon: Wallet },
  ];

  return (
    <RoleGuard role="farmer" tabs={tabs} roleLabelKey="role.farmer">
      {children}
    </RoleGuard>
  );
}