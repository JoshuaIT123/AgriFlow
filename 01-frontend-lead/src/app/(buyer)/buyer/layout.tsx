"use client";

import {
  LayoutDashboard,
  Store,
  Handshake,
  MessageCircle,
  Receipt,
  Wallet,
} from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import type { PanelTab } from "@/components/PanelShell";
import { useAuth } from "@/lib/auth-context";
import { useStoreVersion } from "@/lib/store-bus";
import { getUnreadChatCount } from "@/lib/store";

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  useStoreVersion();

  const tabs: PanelTab[] = [
    { href: "/buyer/dashboard", key: "nav.dashboard", icon: LayoutDashboard, home: true },
    { href: "/buyer/marketplace", key: "mkt.title", icon: Store },
    { href: "/buyer/offers", key: "offer.sent.title", icon: Handshake },
    {
      href: "/chat",
      key: "nav.messages",
      icon: MessageCircle,
      badge: user ? getUnreadChatCount(user.id) : 0,
    },
    { href: "/buyer/payments", key: "nav.payments", icon: Receipt },
    { href: "/buyer/wallet", key: "nav.wallet", icon: Wallet },
  ];

  return (
    <RoleGuard role="buyer" tabs={tabs} roleLabelKey="role.buyer">
      {children}
    </RoleGuard>
  );
}