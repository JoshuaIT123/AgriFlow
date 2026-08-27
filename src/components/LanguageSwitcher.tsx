"use client";

import { useI18n } from "@/lib/i18n-context";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div className="lang-switch" role="group" aria-label={t("lang.label")}>
      <button
        type="button"
        className={locale === "en" ? "active" : ""}
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
      <button
        type="button"
        className={locale === "rw" ? "active" : ""}
        onClick={() => setLocale("rw")}
        aria-pressed={locale === "rw"}
      >
        RW
      </button>
    </div>
  );
}
