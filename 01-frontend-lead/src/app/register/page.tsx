"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  CircleAlert,
  Eye,
  EyeOff,
  LockKeyhole,
  Phone,
  ShoppingBasket,
  Sprout,
  User,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

const NETWORKS = [
  { key: "common.mtn", value: "MTN", dot: "bg-yellow-400" },
  { key: "common.airtel", value: "AIRTEL", dot: "bg-red-500" },
] as const;

const ROLES: {
  value: Role;
  icon: typeof Sprout;
  titleKey: string;
  hint: "farmer" | "buyer";
}[] = [
  { value: "farmer", icon: Sprout, titleKey: "auth.role.farmer", hint: "farmer" },
  { value: "buyer", icon: ShoppingBasket, titleKey: "auth.role.buyer", hint: "buyer" },
];

export default function RegisterPage() {
  const { t, locale } = useI18n();
  const { register, user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [network, setNetwork] = useState<string>("MTN");
  const [role, setRole] = useState<Role>("farmer");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) router.replace(panelHome(user.role));
  }, [user, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !phone.trim() || !password || !confirm) {
      setError(t("auth.err.required"));
      return;
    }
    if (!/^[0-9+\s]{9,}$/.test(phone.trim())) {
      setError(t("auth.err.phone"));
      return;
    }
    if (password.length < 6) {
      setError(t("auth.password.hint"));
      return;
    }
    if (password !== confirm) {
      setError(t("auth.err.password"));
      return;
    }
    setBusy(true);
    const ok = await register({
      name: name.trim(),
      phone: phone.trim(),
      password,
      mobileMoney: network,
      role,
      locale,
    });
    setBusy(false);
    if (!ok) setError(t("auth.err.register"));
  };

  return (
    <AuthShell>
      <Card className="gap-0 border-border/70 p-0 shadow-xl shadow-black/5">
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">
            {t("auth.register.title")}
          </CardTitle>
          <CardDescription>{t("auth.register.subtitle")}</CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
              <CircleAlert size={17} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} noValidate className="space-y-4">
            {/* Role picker */}
            <div className="space-y-1.5">
              <Label>{t("auth.role")}</Label>
              <div className="grid grid-cols-2 gap-2.5" role="radiogroup">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  const on = role === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setRole(r.value)}
                      className={cn(
                        "flex flex-col items-start gap-3 rounded-2xl border-2 p-3.5 text-left transition-all",
                        on
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-10 place-items-center rounded-xl transition-colors",
                          on
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent text-muted-foreground"
                        )}
                      >
                        <Icon size={20} />
                      </span>
                      <span className="text-sm font-semibold leading-snug">
                        {t(r.titleKey)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name">{t("auth.fullname")}</Label>
              <div className="relative">
                <User
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  className="h-11 pl-10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("auth.fullname.placeholder")}
                />
              </div>
            </div>

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
              <Label>{t("auth.mobileMoney")}</Label>
              <div className="grid grid-cols-2 gap-2.5" role="radiogroup">
                {NETWORKS.map((n) => {
                  const on = network === n.value;
                  return (
                    <button
                      key={n.value}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setNetwork(n.value)}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border-2 px-3.5 py-3 text-sm font-semibold transition-all",
                        on
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <span className={cn("size-2.5 rounded-full", n.dot)} />
                      {t(n.key)}
                    </button>
                  );
                })}
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
                  autoComplete="new-password"
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
              <p className="text-xs text-muted-foreground">
                {t("auth.password.hint")}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm">{t("auth.confirm")}</Label>
              <Input
                id="confirm"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                className="h-11"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={t("auth.confirm")}
              />
            </div>

            <Button className="h-11 w-full" type="submit" disabled={busy}>
              {busy ? t("common.loading") : t("auth.submit.register")}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("auth.have.account")}{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:underline"
            >
              {t("auth.login.link")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}