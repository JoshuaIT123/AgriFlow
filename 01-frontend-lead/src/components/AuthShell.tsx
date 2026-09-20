"use client";

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { CheckCircle2, Repeat, ShieldCheck, Smartphone } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { LanguageSwitcher } from "./LanguageSwitcher";

const TRUST = [
  {
    icon: ShieldCheck,
    title: "Escrow-backed payments",
    text: "Buyer money is held safely and released only on confirmed delivery.",
  },
  {
    icon: Smartphone,
    title: "Flexible payouts",
    text: "Mobile Money today, with bank transfer, cards and more channels on the way.",
  },
  {
    icon: Repeat,
    title: "Recurring farmer deals",
    text: "Standing arrangements keep income steady, automatic and on time.",
  },
];

export function AuthShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Mobile top bar */}
      <div className="mx-auto flex h-16 max-w-md items-center justify-between px-5 lg:hidden">
        <Link href="/" className="flex items-center gap-2.5">
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
              {t("app.tagline")}
            </span>
          </span>
        </Link>
        <LanguageSwitcher />
      </div>

      <div className="grid min-h-[calc(100dvh-4rem)] lg:min-h-dvh lg:grid-cols-2">
        {/* Branding panel (desktop) */}
        <aside className="relative hidden overflow-hidden bg-emerald-950 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0">
            <Image
              src="/images/hero-farmers.jpg"
              alt="Farmers working in the field"
              fill
              priority
              sizes="50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#06281a]/95 via-[#0b3d24]/85 to-[#0b3d24]/60" />
            <div className="absolute -left-32 top-1/3 size-96 rounded-full bg-lime-300/15 blur-3xl" />
          </div>

          <div className="relative z-10 flex items-center gap-3 p-10">
            <Image
              src="/images/logo.png"
              alt="AgriFlow logo"
              width={40}
              height={40}
              className="h-11 w-11 rounded-xl object-cover shadow-lg"
              priority
            />
            <div className="leading-tight">
              <div className="text-lg font-bold tracking-tight">
                {t("app.name")}
              </div>
              <div className="text-sm text-white/70">{t("app.tagline")}</div>
            </div>
            <div className="ml-auto">
              <LanguageSwitcher />
            </div>
          </div>

          <div className="relative z-10 p-10 pt-0">
            <h2 className="text-4xl font-bold leading-tight tracking-tight">
              A marketplace that pays{" "}
              <span className="text-lime-300">farmers on delivery.</span>
            </h2>
            <ul className="mt-10 space-y-6">
              {TRUST.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.title} className="flex items-start gap-4">
                    <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-lime-300 backdrop-blur">
                      <Icon size={20} />
                    </span>
                    <div>
                      <div className="font-semibold">{item.title}</div>
                      <div className="mt-0.5 text-sm text-white/70">
                        {item.text}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="relative z-10 flex items-center gap-6 border-t border-white/10 p-10">
            {[
              { v: "100%", l: "in escrow" },
              { v: "72h", l: "to settle" },
              { v: "3+", l: "networks" },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-2xl font-bold text-lime-300">{s.v}</div>
                <div className="text-xs text-white/60">{s.l}</div>
              </div>
            ))}
          </div>
        </aside>

        {/* Form column */}
        <main className="flex items-center justify-center px-4 py-10 lg:py-16">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>

      <div className="flex justify-center gap-2 pb-6 text-xs text-muted-foreground lg:hidden">
        <CheckCircle2 size={14} className="text-primary" />
        {t("landing.secure.badge")}
      </div>
    </div>
  );
}