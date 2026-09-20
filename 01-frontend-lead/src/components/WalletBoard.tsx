"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useStoreVersion } from "@/lib/store-bus";
import { getWalletTxns, simulateWalletTopUp, walletBalance, walletHeld } from "@/lib/store";
import { formatDate, formatRwf } from "@/lib/format";
import { ArrowDown, ArrowUp, LockKeyhole, Plus, Wallet } from "lucide-react";
import { Toast } from "./Toast";
import { LightningPay } from "./LightningPay";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function WalletBoard({
  accountId,
  role = "buyer",
}: {
  accountId: string;
  role?: "buyer" | "farmer";
}) {
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t("wallet.title")}
        </h1>
      </div>

      {/* Balance hero */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#08301f] via-[#0d4a2d] to-[#146b3d] text-white shadow-lg shadow-emerald-950/20">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-white/70">
                <Wallet size={15} aria-hidden />
                {t("wallet.balance")}
              </div>
              <div className="mt-1 font-mono text-3xl font-bold tracking-tight sm:text-4xl">
                {formatRwf(balance)}
              </div>
            </div>
            <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-lime-300">
              <LockKeyhole size={13} aria-hidden />
              {t("wallet.escrow")}:{" "}
              <span className="font-mono font-semibold">
                {formatRwf(held)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top-up + Lightning */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="gap-0 p-0">
          <CardHeader>
            <CardTitle className="text-base">{t("wallet.topup")}</CardTitle>
            <CardDescription>{t("wallet.topup.hint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={topUp} className="flex gap-2.5">
              <Input
                type="number"
                inputMode="numeric"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t("wallet.topup.amount")}
                aria-label={t("wallet.topup.amount")}
              />
              <Button type="submit" disabled={!amount}>
                <Plus size={15} aria-hidden />
                {t("wallet.topup.btn")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <LightningPay accountId={accountId} role={role} />
      </div>

      {/* Transactions */}
      <Card className="gap-0 p-0">
        <CardHeader>
          <CardTitle className="text-base">{t("wallet.txns")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {txns.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              {t("wallet.empty")}
            </div>
          ) : (
            <div className="divide-y divide-border/60 px-4 sm:px-5">
              {txns.map((tx) => {
                const isCredit = tx.kind === "credit";
                return (
                  <div
                    key={tx.id}
                    className="flex flex-wrap items-center gap-3 py-3"
                  >
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-xl",
                        isCredit
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-red-500/10 text-red-500"
                      )}
                    >
                      {isCredit ? (
                        <ArrowDown size={18} aria-hidden />
                      ) : (
                        <ArrowUp size={18} aria-hidden />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">
                        {noteLabel(tx.note)}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {isCredit
                          ? t("wallet.txn.credit")
                          : t("wallet.txn.debit")}{" "}
                        · {formatDate(tx.createdAt, displayLocale)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={cn(
                          "font-mono text-sm font-bold",
                          isCredit ? "text-emerald-600" : "text-red-500"
                        )}
                      >
                        {isCredit ? "+" : "−"}
                        {formatRwf(tx.amount)}
                      </span>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {tx.status === "pending" ? t("wallet.escrow") : ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Toast message={toast} />
    </div>
  );
}