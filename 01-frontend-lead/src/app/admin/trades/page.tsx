"use client";

import { useMemo } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useStoreVersion } from "@/lib/store-bus";
import { cachedDeals } from "@/lib/remote";
import { dealEtaHours } from "@/lib/admin";
import { formatCountdown, formatDate, formatRwf } from "@/lib/format";
import { unitKey, unitOf } from "@/lib/units";
import { DealBadge } from "@/components/Badge";
import { Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminTrades() {
  const { t, locale } = useI18n();
  const displayLocale = locale === "rw" ? "en" : locale;
  const version = useStoreVersion();

  const deals = useMemo(
    () =>
      [...cachedDeals()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    // re-read on every store mutation via version
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version]
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t("admin.trades.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("admin.trades.subtitle")}
        </p>
      </div>

      <Card className="gap-0 p-0">
        <CardContent className="p-0">
          {deals.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Package size={24} aria-hidden />
              </span>
              <p className="text-sm text-muted-foreground">
                {t("admin.trades.empty")}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {deals.map((d) => {
                const pending = d.status === "pending_delivery";
                return (
                  <div
                    key={d.id}
                    className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Package size={18} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">
                        {d.productTitle}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span>
                          {d.farmerName} ↔ {d.buyerName} · {d.quantityKg}{" "}
                          {t(unitKey(unitOf(d.unit)))}
                        </span>
                        <DealBadge status={d.status} />
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-right">
                      <span className="font-mono text-sm font-semibold">
                        {formatRwf(d.amountRwf)}
                      </span>
                      {pending ? (
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                          {t("admin.eta")} ·{" "}
                          {formatCountdown("", dealEtaHours(d.createdAt)).trim()}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          {formatDate(d.confirmedAt ?? d.createdAt, displayLocale)}
                        </span>
                      )}
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