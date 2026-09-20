"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useStoreVersion } from "@/lib/store-bus";
import { getDealForOffer, getMyOffers, getProducts } from "@/lib/store";
import { formatRwf } from "@/lib/format";
import { unitKey, unitOf } from "@/lib/units";
import { OfferBadge } from "@/components/Badge";
import { TradePayDialog } from "@/components/TradePayDialog";
import { Toast } from "@/components/Toast";
import type { Deal } from "@/lib/types";
import { ChevronRight, Handshake, MessageCircle } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

export default function BuyerOffers() {
  const { user } = useAuth();
  const { t } = useI18n();
  const version = useStoreVersion();
  const [payDeal, setPayDeal] = useState<Deal | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const rows = useMemo(() => {
    if (!user) return [];
    const all = getProducts();
    const info = new Map(
      all.map((p) => [p.id, { title: p.title, farmerId: p.farmerId, farmerName: p.farmerName }])
    );
    return getMyOffers(user.id).map((o) => {
      const p = info.get(o.productId);
      return {
        offer: o,
        productTitle: p?.title ?? o.productId.slice(0, 6),
        farmerId: p?.farmerId ?? "",
        farmerName: p?.farmerName ?? "",
        // Present only while the opened trade still awaits payment.
        deal: getDealForOffer(o.id),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, version]);

  if (!user) return null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t("offer.sent.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("offer.sent.subtitle")}
        </p>
      </div>

      <Card className="gap-0 p-0">
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-600">
                <Handshake size={24} aria-hidden />
              </span>
              <p className="text-sm text-muted-foreground">{t("offer.noSent")}</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {rows.map(({ offer, productTitle, farmerId, farmerName, deal }) => {
                const payable = deal?.tradeStatus === "AGREED";
                return (
                  <div
                    key={offer.id}
                    onClick={() => payable && deal && setPayDeal(deal)}
                    role={payable ? "button" : undefined}
                    tabIndex={payable ? 0 : undefined}
                    className={
                      payable
                        ? "group flex flex-wrap items-center gap-3 px-4 py-3.5 transition-colors hover:bg-primary/5 sm:px-5"
                        : "flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5"
                    }
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
                      <Handshake size={18} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">
                        {productTitle}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span>
                          {formatRwf(offer.pricePerKg)}/
                          {t(unitKey(unitOf(offer.unit)))} · {offer.quantityKg}{" "}
                          {t(unitKey(unitOf(offer.unit)))}
                        </span>
                        <OfferBadge status={offer.status} />
                        {payable && (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-700">
                            {t("offer.tapToPay")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {farmerId && (
                        <Link
                          href={`/chat?with=${farmerId}&name=${encodeURIComponent(
                            farmerName || ""
                          )}&product=${offer.productId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                          title={t("chat.contact")}
                          aria-label={t("chat.contact")}
                        >
                          <MessageCircle size={17} />
                        </Link>
                      )}
                      <span className="font-mono text-sm font-semibold">
                        {formatRwf(offer.quantityKg * offer.pricePerKg)}
                      </span>
                      {payable && (
                        <ChevronRight
                          size={16}
                          className="text-muted-foreground transition-transform group-hover:translate-x-0.5"
                          aria-hidden
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {payDeal && (
        <TradePayDialog
          deal={payDeal}
          onClose={(paid) => {
            setPayDeal(null);
            if (paid) setToast(t("pay.paid"));
          }}
        />
      )}

      <Toast message={toast} />
    </div>
  );
}