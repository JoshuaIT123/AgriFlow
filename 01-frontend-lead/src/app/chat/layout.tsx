"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Handshake,
  MessageCircle,
  Receipt,
  Wallet,
  Wheat,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useStoreVersion } from "@/lib/store-bus";
import { getUnreadChatCount } from "@/lib/store";
import { PanelShell, type PanelTab } from "@/components/PanelShell";

export default function ChatLayout({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  useStoreVersion();

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) {
    return <div className="spinner">{t("common.loading")}</div>;
  }

  const isFarmer = user.role === "farmer";
  const tabs: PanelTab[] = [
    isFarmer
      ? { href: "/farmer/dashboard", key: "farmer.nav.dashboard", icon: LayoutDashboard, home: true }
      : { href: "/buyer/dashboard", key: "nav.dashboard", icon: LayoutDashboard, home: true },
    isFarmer
      ? { href: "/farmer/products", key: "farmer.nav.products", icon: Wheat }
      : { href: "/buyer/marketplace", key: "mkt.title", icon: Store },
    isFarmer
      ? { href: "/farmer/offers", key: "farmer.nav.offers", icon: Handshake }
      : { href: "/buyer/offers", key: "offer.sent.title", icon: Handshake },
    {
      href: "/chat",
      key: "nav.messages",
      icon: MessageCircle,
      badge: getUnreadChatCount(user.id),
    },
    isFarmer
      ? { href: "/farmer/payments", key: "farmer.nav.payments", icon: Receipt }
      : { href: "/buyer/payments", key: "nav.payments", icon: Receipt },
    isFarmer
      ? { href: "/farmer/wallet", key: "farmer.nav.wallet", icon: Wallet }
      : { href: "/buyer/wallet", key: "nav.wallet", icon: Wallet },
  ];

  return (
    <PanelShell tabs={tabs} roleLabelKey={isFarmer ? "role.farmer" : "role.buyer"}>
      {children}
    </PanelShell>
  );
}