"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, Eye, EyeOff, LockKeyhole, Phone, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { useAuth, panelHome } from "@/lib/auth-context";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const { t } = useI18n();
  const { login, user } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) router.replace(panelHome(user.role));
  }, [user, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phone.trim() || !password) {
      setError(t("auth.err.required"));
      return;
    }
    if (!/^[0-9+\s]{9,}$/.test(phone.trim())) {
      setError(t("auth.err.phone"));
      return;
    }
    setBusy(true);
    const ok = await login(phone.trim(), password);
    setBusy(false);
    if (!ok) setError(t("auth.err.login"));
  };

  return (
    <AuthShell>
      <Card className="gap-0 border-border/70 p-0 shadow-xl shadow-black/5">
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">
            {t("auth.login.title")}
          </CardTitle>
          <CardDescription>{t("auth.login.subtitle")}</CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
              <CircleAlert size={17} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">{t("auth.phone.placeholder")}</Label>
              <div className="relative">
                <Phone
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  className="h-11 pl-10"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("auth.phone.placeholder")}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <div className="relative">
                <LockKeyhole
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  className="h-11 pl-10 pr-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.password.placeholder")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button className="h-11 w-full" type="submit" disabled={busy}>
              {busy ? t("common.loading") : t("auth.submit.login")}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("auth.no.account")}{" "}
            <Link
              href="/register"
              className="font-semibold text-primary hover:underline"
            >
              {t("auth.register.link")}
            </Link>
          </p>
        </CardContent>
      </Card>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        {t("auth.demo.hint")}
      </p>
      <p className="mt-2 text-center text-xs">
        <Link
          href="/admin/login"
          className="inline-flex items-center gap-1 font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ShieldCheck size={13} aria-hidden />
          {t("auth.admin")}
        </Link>
      </p>
    </AuthShell>
  );
}