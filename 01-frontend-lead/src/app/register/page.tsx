"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n-context";
import { useAuth, panelHome } from "@/lib/auth-context";
import { AuthShell } from "@/components/AuthShell";
import type { Role } from "@/lib/types";

const NETWORKS = ["common.mtn", "common.airtel"] as const;

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) router.replace(panelHome(user.role));
  }, [user, router]);

  const networkLabel = (key: string) => t(key);

  const onSubmit = (e: FormEvent) => {
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
    register({
      name: name.trim(),
      phone: phone.trim(),
      password,
      mobileMoney: network,
      role,
      locale,
    });
  };

  return (
    <AuthShell>
      <div className="card">
        <h1 style={{ fontSize: 22 }}>{t("auth.register.title")}</h1>
        <p className="subtle" style={{ margin: "6px 0 18px" }}>
          {t("auth.register.subtitle")}
        </p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor="role">{t("auth.role")}</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              <option value="farmer">{t("auth.role.farmer")}</option>
              <option value="buyer">{t("auth.role.buyer")}</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="name">{t("auth.fullname")}</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("auth.fullname.placeholder")}
            />
          </div>

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
            <label htmlFor="network">{t("auth.mobileMoney")}</label>
            <select
              id="network"
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
            >
              {NETWORKS.map((n) => (
                <option key={n} value={n.replace("common.", "").toUpperCase()}>
                  {networkLabel(n)}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="password">{t("auth.password")}</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.password.placeholder")}
            />
            <span className="hint">{t("auth.password.hint")}</span>
          </div>

          <div className="field">
            <label htmlFor="confirm">{t("auth.confirm")}</label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={t("auth.confirm")}
            />
          </div>

          <button className="btn btn-primary btn-block" type="submit">
            {t("auth.submit.register")}
          </button>
        </form>

        <p className="subtle" style={{ marginTop: 16, textAlign: "center" }}>
          {t("auth.have.account")}{" "}
          <Link href="/login" style={{ color: "var(--brand)", fontWeight: 700 }}>
            {t("auth.login.link")}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
