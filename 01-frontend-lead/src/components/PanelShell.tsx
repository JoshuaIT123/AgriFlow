"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { LogOut, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PanelTab {
  href: string;
  key: string;
  icon: LucideIcon;
  home?: boolean;
  /** Optional unread count shown as a pill next to the label. */
  badge?: number;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function PanelShell({
  tabs,
  children,
  roleLabelKey,
}: {
  tabs: PanelTab[];
  children: ReactNode;
  roleLabelKey: string;
}) {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const pathname = usePathname();
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

  const isActive = (tab: PanelTab) =>
    active === tab.href ||
    (tab.home && (active === "/" || active.startsWith(tab.href)));

  const activeTab = tabs.find(isActive) ?? tabs[0];
  const roleLabel = t(roleLabelKey);
  const displayName = user?.name ?? "";
  const roleIcon = roleLabelKey === "role.farmer" ? "🌱" : "🛒";

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* ================= Desktop sidebar ================= */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card/80 backdrop-blur md:flex">
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
              {t("app.name")}
            </div>
            <div className="text-xs text-muted-foreground">
              {t("app.tagline")}
            </div>
          </div>
        </div>

        <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-3">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const on = isActive(tab);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                  on
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <TabIcon size={18} strokeWidth={2} aria-hidden />
                <span className="truncate">{t(tab.key)}</span>
                {typeof tab.badge === "number" && tab.badge > 0 && (
                  <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                    {tab.badge > 99 ? "99+" : tab.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className="border-t border-border p-3">
            <div className="flex items-center gap-3 rounded-xl bg-accent/60 p-3">
              <Avatar className="size-10 border border-primary/20 bg-primary text-primary-foreground">
                <AvatarFallback className="bg-primary font-bold text-primary-foreground">
                  {initials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-sm font-bold">{displayName}</div>
                <div className="text-xs text-muted-foreground">
                  {roleIcon} {roleLabel}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 rounded-lg text-muted-foreground"
                onClick={logout}
                title={t("nav.logout")}
                aria-label={t("nav.logout")}
              >
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        )}
      </aside>

      {/* ================= Main column ================= */}
      <div className="md:pl-64">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur md:hidden">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
            <Link href={activeTab?.href ?? "/"} className="flex items-center gap-2.5">
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
                  {t("app.name")}
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  {roleIcon} {roleLabel}
                </span>
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              {user && (
                <Avatar className="size-9 border border-primary/20 bg-primary text-primary-foreground">
                  <AvatarFallback className="bg-primary text-[11px] font-bold text-primary-foreground">
                    {initials(displayName)}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        </header>

        {/* Desktop context row */}
        <div className="sticky top-0 z-20 hidden border-b border-transparent bg-transparent md:block">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-8 pt-6 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap size={14} className="text-primary" aria-hidden />
              <span className="font-semibold text-foreground">
                {activeTab ? t(activeTab.key) : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
            </div>
          </div>
        </div>

        {offline && (
          <div className="bg-amber-100 px-4 py-2 text-center text-xs font-semibold text-amber-800">
            {t("common.offline")}
          </div>
        )}

        <main className="pb-28 md:pb-12">
          <div className="mx-auto max-w-5xl px-4 py-5 md:px-8 md:py-7">
            {children}
          </div>
        </main>
      </div>

      {/* ================= Mobile bottom nav dock ================= */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden"
        aria-label="Main navigation"
      >
        <div className="mx-auto flex max-w-5xl items-end justify-between rounded-2xl border border-border bg-card/95 p-1.5 shadow-lg shadow-black/5 backdrop-blur">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const on = isActive(tab);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-semibold transition-colors",
                  on
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground"
                )}
              >
                <span className="relative">
  <TabIcon size={19} strokeWidth={on ? 2.4 : 2} aria-hidden />
  {typeof tab.badge === "number" && tab.badge > 0 && (
    <span className="absolute -right-2 -top-1.5 grid min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-4 text-white">
      {tab.badge > 99 ? "99+" : tab.badge}
    </span>
  )}
</span>
                <span className="truncate leading-none">{t(tab.key)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}