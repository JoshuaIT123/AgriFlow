"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n-context";
import { useAuth, panelHome } from "@/lib/auth-context";
import { AuthShell } from "@/components/AuthShell";

export default function LoginPage() {
  const { t } = useI18n();
  const { login, user } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) router.replace(panelHome(user.role));
  }, [user, router]);

  const onSubmit = (e: FormEvent) => {
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
    if (!login(phone.trim(), password)) {
      setError(t("auth.err.login"));
    }
  };

  return (
    <AuthShell>
      <div className="card">
        <h1 style={{ fontSize: 22 }}>{t("auth.login.title")}</h1>
        <p className="subtle" style={{ margin: "6px 0 18px" }}>
          {t("auth.login.subtitle")}
        </p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor="phone">{t("auth.phone.placeholder")}</label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("auth.phone.placeholder")}
            />
          </div>

          <div className="field">
            <label htmlFor="password">{t("auth.password")}</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.password.placeholder")}
            />
          </div>

          <button className="btn btn-primary btn-block" type="submit">
            {t("auth.submit.login")}
          </button>
        </form>

        <p className="subtle" style={{ marginTop: 16, textAlign: "center" }}>
          {t("auth.no.account")}{" "}
          <Link href="/register" style={{ color: "var(--brand)", fontWeight: 700 }}>
            {t("auth.register.link")}
          </Link>
        </p>
      </div>
      <p className="subtle" style={{ textAlign: "center", marginTop: 16 }}>
        {t("auth.demo.hint")}
      </p>
    </AuthShell>
  );
}
