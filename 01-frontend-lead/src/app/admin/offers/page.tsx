"use client";

import { useMemo } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useStoreVersion } from "@/lib/store-bus";
import { cachedOffers, cachedProducts } from "@/lib/remote";
import { formatDate, formatRwf } from "@/lib/format";
import { unitKey, unitOf } from "@/lib/units";
import { OfferBadge } from "@/components/Badge";
import { Handshake } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminOffers() {
  const { t, locale } = useI18n();
  const displayLocale = locale === "rw" ? "en" : locale;
  const version = useStoreVersion();

  const rows = useMemo(() => {
    const title = new Map(cachedProducts().map((p) => [p.id, p.title]));
    return [...cachedOffers()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((o) => ({
        offer: o,
        productTitle: title.get(o.productId) ?? o.productId.slice(0, 6),
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t("admin.offers.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("admin.offers.subtitle")}
        </p>
      </div>

      <Card className="gap-0 p-0">
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-600">
                <Handshake size={24} aria-hidden />
              </span>
              <p className="text-sm text-muted-foreground">
                {t("admin.offers.empty")}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {rows.map(({ offer, productTitle }) => (
                <div
                  key={offer.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
                    <Handshake size={18} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">
                      {offer.buyerName} → {productTitle}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <span>
                        {formatRwf(offer.pricePerKg)}/
                        {t(unitKey(unitOf(offer.unit)))} · {offer.quantityKg}{" "}
                        {t(unitKey(unitOf(offer.unit)))}
                      </span>
                      <OfferBadge status={offer.status} />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 text-right">
                    <span className="font-mono text-sm font-semibold">
                      {formatRwf(offer.quantityKg * offer.pricePerKg)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDate(offer.createdAt, displayLocale)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}