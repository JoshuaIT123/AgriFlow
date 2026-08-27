"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="landing" style={{ minHeight: "100vh" }}>
      <div className="landing-cover" style={{ paddingTop: 40 }}>
        <div
          className="row"
          style={{ justifyContent: "space-between", width: "100%", maxWidth: 440 }}
        >
          <Link href="/" className="brand">
            <span className="brand-mark">V</span>
            <span className="appname-line">
              <span>{t("app.name")}</span>
              <span className="appname-sub">{t("app.tagline")}</span>
            </span>
          </Link>
          <LanguageSwitcher />
        </div>
        <div className="landing-logo" style={{ marginTop: 34, background: "linear-gradient(135deg, #54705f, #8ba393)" }}>
          404
        </div>
        <h1>{t("common.notFound")}</h1>
        <div className="landing-actions">
          <Link href="/" className="btn btn-primary btn-block">
            {t("common.back")}
          </Link>
        </div>
      </div>
    </div>
  );
}
