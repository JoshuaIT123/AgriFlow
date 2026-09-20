"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { setAdminActive } from "@/lib/admin";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LockKeyhole, ShieldCheck } from "lucide-react";

export default function AdminLogin() {
  const { t } = useI18n();
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = () => {
    if (pin.trim().length < 6) {
      setError(true);
      return;
    }
    setError(false);
    setBusy(true);
    setAdminActive(true);
    router.replace("/admin");
  };

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#0a0f1d] px-4 text-white">
      <div className="absolute -left-24 top-1/4 size-96 rounded-full bg-lime-300/10 blur-3xl" />
      <div className="absolute -right-24 bottom-1/4 size-96 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/images/logo.png"
            alt="AgriFlow logo"
            width={56}
            height={56}
            className="h-14 w-14 rounded-2xl object-cover shadow-lg"
            priority
          />
          <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-lime-300">
            <ShieldCheck size={14} aria-hidden />
            {t("admin.login.title")}
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">
            {t("admin.login.title")}
          </h1>
          <p className="mt-2 text-sm text-white/60">
            {t("admin.login.subtitle")}
          </p>
        </div>

        <form
          className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label className="text-xs font-semibold text-white/70" htmlFor="pin">
            {t("admin.login.pin")}
          </label>
          <div className="relative mt-2">
            <LockKeyhole
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
              aria-hidden
            />
            <Input
              id="pin"
              type="password"
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••••"
              className="h-12 pl-11 bg-white/5 text-white placeholder:text-white/30"
            />
          </div>
          {error && (
            <p className="mt-2 text-xs font-medium text-red-300">
              {t("admin.login.err")}
            </p>
          )}
          <p className="mt-2 text-xs text-white/50">{t("admin.login.pinHint")}</p>
          <Button
            type="submit"
            variant="lime"
            className="mt-5 h-12 w-full text-emerald-950"
            disabled={busy}
          >
            {t("admin.login.btn")}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm font-medium text-white/50 transition-colors hover:text-white"
          >
            ← {t("admin.backToApp")}
          </Link>
        </div>
      </div>
    </div>
  );
}