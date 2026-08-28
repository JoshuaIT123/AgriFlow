"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useStoreVersion } from "@/lib/store-bus";
import { getWalletTxns, simulateWalletTopUp, walletBalance, walletHeld } from "@/lib/store";
import { formatDate, formatRwf } from "@/lib/format";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Toast } from "./Toast";
import { LightningPay } from "./LightningPay";

export function WalletBoard({ accountId, role = "buyer" }: { accountId: string; role?: "buyer" | "farmer" }) {
  const { t, locale } = useI18n();
  const version = useStoreVersion();
  const [amount, setAmount] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const displayLocale = locale === "rw" ? "en" : locale;

  const txns = useMemo(
    () => getWalletTxns(accountId),
    // re-read on every store mutation via version
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accountId, version]
  );

  const balance = walletBalance(accountId);
  const held = walletHeld(accountId);

  const topUp = (e: FormEvent) => {
    e.preventDefault();
    const a = Number(amount);
    if (!a || a <= 0) return;
    simulateWalletTopUp(accountId, a);
    setAmount("");
    setToast(t("wallet.topup.done"));
  };

  const noteLabel = (note: string) => {
    if (note.startsWith("escrow:")) return t("wallet.txn.escrow");
    if (note.startsWith("deal:")) return t("wallet.txn.deal");
    if (note === "top_up") return t("wallet.txn.top_up");
    if (note === "seed") return t("wallet.txn.seed");
    return note;
  };

  return (
    <div className="container">
      <h2 style={{ fontSize: 20, marginBottom: 14 }}>{t("wallet.title")}</h2>

      <div className="balance-card">
        <div className="label">{t("wallet.balance")}</div>
        <div className="value mono">{formatRwf(balance)}</div>
        <div className="sub">
          {t("wallet.escrow")}: <strong className="mono">{formatRwf(held)}</strong>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h3 style={{ fontSize: 15, marginBottom: 4 }}>{t("wallet.topup")}</h3>
        <p className="subtle" style={{ margin: "0 0 12px" }}>
          {t("wallet.topup.hint")}
        </p>
        <form onSubmit={topUp} className="row" style={{ gap: 8, alignItems: "start" }}>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t("wallet.topup.amount")}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={!amount}>
            {t("wallet.topup.btn")}
          </button>
        </form>
      </div>

      <LightningPay accountId={accountId} role={role} />

      <div className="section-head">
        <h3>{t("wallet.txns")}</h3>
      </div>
      <div className="card">
        {txns.length === 0 ? (
          <div className="empty">{t("wallet.empty")}</div>
        ) : (
          txns.map((tx) => {
            const isCredit = tx.kind === "credit";
            return (
              <div className="tx-row" key={tx.id}>
                <div className="tx-icon" aria-hidden>
                  {isCredit ? <ArrowDown size={22} /> : <ArrowUp size={22} />}
                </div>
                <div className="tx-main">
                  <div className="tx-title">{noteLabel(tx.note)}</div>
                  <div className="tx-sub">
                    {isCredit ? t("wallet.txn.credit") : t("wallet.txn.debit")} ·{" "}
                    {formatDate(tx.createdAt, displayLocale)}
                  </div>
                </div>
                <div className="tx-side">
                  <div
                    className="tx-amount mono"
                    style={{ color: isCredit ? "var(--green)" : "var(--danger)" }}
                  >
                    {isCredit ? "+" : "−"}
                    {formatRwf(tx.amount)}
                  </div>
                  <div className="tx-meta">
                    {tx.status === "pending" ? t("wallet.escrow") : ""}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Toast message={toast} />
    </div>
  );
}
