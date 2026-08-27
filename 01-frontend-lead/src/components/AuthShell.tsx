"use client";

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n-context";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function AuthShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="landing" style={{ minHeight: "100vh" }}>
      <div className="landing-cover" style={{ paddingTop: 36, paddingBottom: 20 }}>
        <div
          className="row"
          style={{ justifyContent: "space-between", width: "100%", maxWidth: 440 }}
        >
          <Link href="/" className="brand">
            <Image
              src="/images/logo.png"
              alt="AgriFlow logo"
              width={36}
              height={36}
              className="brand-logo"
              priority
            />
            <span className="appname-line">
              <span>{t("app.name")}</span>
              <span className="appname-sub">{t("app.tagline")}</span>
            </span>
          </Link>
          <LanguageSwitcher />
        </div>
      </div>

      <div className="container" style={{ maxWidth: 440, paddingBottom: 48 }}>
        {children}
      </div>
    </div>
  );
}
