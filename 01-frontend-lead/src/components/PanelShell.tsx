"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import { LanguageSwitcher } from "./LanguageSwitcher";

export interface PanelTab {
  href: string;
  key: string;
  icon: string;
  home?: boolean;
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

  return (
    <>
      <header className="topbar">
        <div className="container topbar-inner">
          <span className="brand">
            <Image
              src="/images/logo.png"
              alt="AgriFlow logo"
              width={32}
              height={32}
              className="brand-logo"
              priority
            />
            <span className="appname-line">
              <span>{t("app.name")}</span>
              <span className="appname-sub">{t(roleLabelKey)}</span>
            </span>
          </span>
          <div className="row" style={{ gap: 8 }}>
            <LanguageSwitcher />
            {user && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={logout}
                title={t("nav.logout")}
              >
                {t("nav.logout")}
              </button>
            )}
          </div>
        </div>
      </header>

      {offline && <div className="offline-banner">{t("common.offline")}</div>}

      <main className="page">{children}</main>

      <nav className="bottomnav" aria-label="Main navigation">
        <div
          className="bottomnav-inner"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
        >
          {tabs.map((tab) => {
            const isActive =
              active === tab.href ||
              (tab.home && (active === "/" || active.startsWith(tab.href)));
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`nav-item ${isActive ? "active" : ""}`}
              >
                <span className="nav-icon" aria-hidden>
                  {tab.icon}
                </span>
                {t(tab.key)}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
