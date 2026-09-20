import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, ShieldCheck, Smartphone, Zap } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const NAV = {
  marketplace: [
    { label: "How it works", href: "#how" },
    { label: "What farmers sell", href: "#products" },
    { label: "Live marketplace", href: "#products" },
    { label: "Features", href: "#features" },
  ],
  access: [
    { label: "Create an account", href: "/register" },
    { label: "Sign in", href: "/login" },
    { label: "USSD demo (*789#)", href: "/ussd" },
    { label: "Flexible payments", href: "#features" },
  ],
} as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-emerald-900/40 bg-[#06281a] text-white/75">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
          {/* Brand */}
          <div>
            <Link href="/" className="flex w-fit items-center gap-2.5">
              <Image
                src="/images/logo.png"
                alt="AgriFlow logo"
                width={40}
                height={40}
                className="h-10 w-10 rounded-xl object-cover shadow"
              />
              <span className="leading-tight">
                <span className="block text-[15px] font-bold tracking-tight text-white">
                  AgriFlow
                </span>
                <span className="block text-[11px] text-white/60">
                  Farming, paid on delivery
                </span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed">
              AgriFlow is a digital marketplace where farmers sell directly to
              buyers — offers, escrow and payouts all in one place. Payments are
              secured in escrow and released the moment delivery is confirmed,
              through Mobile Money today and more channels on the way.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-lime-300">
                <ShieldCheck size={13} aria-hidden />
                Escrow secured
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-lime-300">
                <Smartphone size={13} aria-hidden />
                Mobile Money & more
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-lime-300">
                <Zap size={13} aria-hidden />
                Lightning-fast
              </span>
            </div>
          </div>

          {/* Marketplace */}
          <nav aria-label="Marketplace">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">
              Marketplace
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {NAV.marketplace.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="transition-colors hover:text-lime-300"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Access */}
          <nav aria-label="Access">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">
              Get started
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {NAV.access.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="transition-colors hover:text-lime-300"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Support */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">
              Support
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <span className="inline-flex items-center gap-1.5">
                  <BadgeCheck size={14} className="text-lime-300" aria-hidden />
                  In-app support via AgriFlow Chat
                </span>
              </li>
              <li>
                <span className="text-white/60">
                  Works on feature phones too — dial{" "}
                  <span className="font-mono font-semibold text-lime-300">
                    *789#
                  </span>
                </span>
              </li>
            </ul>
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold text-white/60">
                Language
              </p>
              <div className="rounded-xl bg-white/5 p-1.5 w-fit">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-white/50 sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} AgriFlow. Farming, paid on delivery.</span>
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-5">
            <span>Every payment secured in escrow until delivery is confirmed.</span>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold text-white/60 transition-colors hover:text-lime-300"
            >
              <ShieldCheck size={12} aria-hidden />
              Admin console
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}