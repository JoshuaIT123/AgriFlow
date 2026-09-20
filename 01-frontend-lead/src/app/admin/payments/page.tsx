"use client";

import { useMemo } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useStoreVersion } from "@/lib/store-bus";
import { getAllAccounts, getAllWalletTxns } from "@/lib/store";
import { adminKpis } from "@/lib/admin";
import { formatDate, formatRwf } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ArrowDownToLine, ArrowUpFromLine, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminPayments() {
  const { t, locale } = useI18n();
  const displayLocale = locale === "rw" ? "en" : locale;
  const version = useStoreVersion();

  const kpis = useMemo(() => adminKpis(), [version]);
  const rows = useMemo(() => {
    const accountName = new Map(getAllAccounts().map((a) => [a.id, a.name]));
    return getAllWalletTxns().map((txn) => ({
      txn,
      name: accountName.get(txn.accountId) ?? txn.accountId.slice(0, 6),
    }));
    // re-read on every store mutation via version
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const hero = [
    { label: t("admin.kpi.escrow"), value: kpis.escrowHeld },
    { label: t("admin.kpi.released"), value: kpis.releasedVolume },
    { label: t("admin.kpi.wallet"), value: kpis.walletFunds },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t("admin.payments.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("admin.payments.subtitle")}
        </p>
      </div>

      {/* Money hero */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#0a0f1d] via-[#123047] to-[#14532d] text-white shadow-lg">
        <CardContent className="grid gap-6 p-6 sm:grid-cols-3 sm:p-7">
          {hero.map((h) => (
            <div key={h.label}>
              <div className="text-xs font-semibold uppercase tracking-widest text-white/60">
                {h.label}
              </div>
              <div className="mt-1 font-mono text-2xl font-bold tracking-tight text-lime-300 sm:text-3xl">
                {formatRwf(h.value)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Ledger */}
      <Card className="gap-0 p-0">
        <CardContent className="p-0">
          <div className="border-b border-border/60 px-4 py-3 text-sm font-bold sm:px-5">
            {t("admin.payments.ledger")}
          </div>
          {rows.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Wallet size={24} aria-hidden />
              </span>
              <p className="text-sm text-muted-foreground">
                {t("admin.payments.ledger.empty")}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {rows.map(({ txn, name }) => {
                const credit = txn.kind === "credit";
                return (
                  <div
                    key={txn.id}
                    className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5"
                  >
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-xl",
                        credit
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-rose-500/10 text-rose-600"
                      )}
                    >
                      {credit ? (
                        <ArrowDownToLine size={18} aria-hidden />
                      ) : (
                        <ArrowUpFromLine size={18} aria-hidden />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">
                        {name}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {t(`wallet.txn.${txn.note}`)} · {formatDate(txn.createdAt, displayLocale)}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "font-mono text-sm font-semibold",
                        credit ? "text-emerald-600" : "text-rose-600"
                      )}
                    >
                      {credit ? "+" : "-"}
                      {formatRwf(txn.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}