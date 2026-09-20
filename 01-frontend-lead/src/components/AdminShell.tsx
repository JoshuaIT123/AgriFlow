"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowLeftRight,
  Handshake,
  LayoutDashboard,
  LogOut,
  Users,
  Wallet,
} from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { setAdminActive } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AdminTab {
  href: string;
  key: string;
  icon: LucideIcon;
  home?: boolean;
}

export const ADMIN_TABS: AdminTab[] = [
  { href: "/admin", key: "admin.nav.dashboard", icon: LayoutDashboard, home: true },
  { href: "/admin/trades", key: "admin.nav.trades", icon: ArrowLeftRight },
  { href: "/admin/offers", key: "admin.nav.offers", icon: Handshake },
  { href: "/admin/users", key: "admin.nav.users", icon: Users },
  { href: "/admin/payments", key: "admin.nav.payments", icon: Wallet },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [offline, setOffline] = useState<boolean>(
    () => typeof navigator !== "undefined" && !navigator.onLine
  );

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const active = pathname ?? "/";
  const isActive = (tab: AdminTab) =>
    active === tab.href || (tab.home && active === "/admin");

  const signOut = () => {
    setAdminActive(false);
    router.replace("/admin/login");
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* ================= Desktop sidebar ================= */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/5 bg-[#0a0f1d] text-white md:flex">
        <div className="flex items-center gap-3 px-5 pt-6 pb-5">
          <Image
            src="/images/logo.png"
            alt="AgriFlow logo"
            width={38}
            height={38}
            className="h-10 w-10 shrink-0 rounded-xl object-cover shadow-sm"
            priority
          />
          <div className="leading-tight">
            <div className="text-[15px] font-bold tracking-tight">
              AgriFlow
            </div>
            <div className="text-xs text-white/50">{t("admin.roleLabel")}</div>
          </div>
        </div>

        <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-3">
          {ADMIN_TABS.map((tab) => {
            const TabIcon = tab.icon;
            const on = isActive(tab);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                  on
                    ? "bg-lime-300 text-emerald-950"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <TabIcon size={18} strokeWidth={2} aria-hidden />
                {t(tab.key)}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-white/10 p-3">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft size={16} aria-hidden />
            {t("admin.backToApp")}
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-center gap-2 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
            onClick={signOut}
          >
            <LogOut size={16} aria-hidden />
            {t("admin.logout")}
          </Button>
        </div>
      </aside>

      {/* ================= Main column ================= */}
      <div className="md:pl-64">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0a0f1d]/95 text-white backdrop-blur md:hidden">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
            <Link href="/admin" className="flex items-center gap-2.5">
              <Image
                src="/images/logo.png"
                alt="AgriFlow logo"
                width={32}
                height={32}
                className="h-9 w-9 rounded-xl object-cover"
                priority
              />
              <span className="leading-tight">
                <span className="block text-[15px] font-bold tracking-tight">
                  AgriFlow
                </span>
                <span className="block text-[11px] text-white/50">
                  {t("admin.roleLabel")}
                </span>
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        {offline && (
          <div className="bg-amber-100 px-4 py-2 text-center text-xs font-semibold text-amber-800">
            {t("common.offline")}
          </div>
        )}

        <main className="pb-28 md:pb-12">
          <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
      </div>

      {/* ================= Mobile bottom nav dock ================= */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden"
        aria-label="Admin navigation"
      >
        <div className="mx-auto flex max-w-5xl items-end justify-between rounded-2xl border border-white/10 bg-[#0a0f1d]/95 p-1.5 text-white shadow-lg shadow-black/20 backdrop-blur">
          {ADMIN_TABS.map((tab) => {
            const TabIcon = tab.icon;
            const on = isActive(tab);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-semibold transition-colors",
                  on ? "bg-lime-300 text-emerald-950" : "text-white/60"
                )}
              >
                <TabIcon size={19} strokeWidth={on ? 2.4 : 2} aria-hidden />
                <span className="truncate leading-none">{t(tab.key)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}