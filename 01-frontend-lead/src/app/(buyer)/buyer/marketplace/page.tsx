"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useStoreVersion } from "@/lib/store-bus";
import { getAvailableProducts } from "@/lib/store";
import type { Deal, Product } from "@/lib/types";
import { formatRwf } from "@/lib/format";
import { productIcon, unitKey, unitOf } from "@/lib/units";
import { OfferDialog } from "@/components/OfferDialog";
import { TradePayDialog } from "@/components/TradePayDialog";
import { Toast } from "@/components/Toast";
import { MessageCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function BuyerMarketplace() {
  const { user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const version = useStoreVersion();
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<Product | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [payDeal, setPayDeal] = useState<Deal | null>(null);

  const products = useMemo(
    () => getAvailableProducts(),
    // re-read on every store mutation via version
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version]
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.farmerName.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, query]);

  if (!user) return null;

  const closeDialog = (result?: "done" | "exists", deal?: Deal | null) => {
    setTarget(null);
    if (result === "done") {
      // Offers at the asking price open a trade immediately: go to payment.
      if (deal) setPayDeal(deal);
      else setToast(t("offer.make.done"));
    }
    if (result === "exists") setToast(t("offer.make.exists"));
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t("mkt.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("mkt.subtitle")}</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          className="h-12 pl-11"
          placeholder={t("mkt.search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t("mkt.search")}
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/40 px-4 py-16 text-center text-sm text-muted-foreground">
          {query ? t("mkt.noResults") : t("mkt.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const Icon = productIcon(p.category, p.unit);
            const unit = t(unitKey(unitOf(p.unit)));
            return (
              <Card
                key={p.id}
                className="group flex flex-col gap-0 overflow-hidden p-0 transition-shadow hover:shadow-lg hover:shadow-emerald-900/5"
              >
                <div className="relative flex h-28 items-center justify-center bg-gradient-to-br from-emerald-100 via-lime-50 to-emerald-50">
                  <span className="grid size-14 place-items-center rounded-2xl bg-white text-primary shadow-sm transition-transform group-hover:scale-105">
                    <Icon size={26} aria-hidden />
                  </span>
                  <span className="absolute right-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-emerald-900 shadow-sm backdrop-blur">
                    {formatRwf(p.pricePerKg)}/{unit}
                  </span>
                </div>
                <CardContent className="flex flex-1 flex-col gap-1.5 p-4">
                  <h3 className="font-bold leading-snug">{p.title}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {p.farmerName}
                    </span>{" "}
                    · {p.category} · {p.quantityKg} {unit}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                    <div className="font-mono text-base font-bold tracking-tight">
                      {formatRwf(p.pricePerKg)}
                      <span className="text-xs font-medium text-muted-foreground">
                        /{unit}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="size-9 rounded-full p-0"
                      title={t("chat.contact")}
                      aria-label={t("chat.contact")}
                      onClick={() =>
                        router.push(
                          `/chat?with=${p.farmerId}&name=${encodeURIComponent(p.farmerName)}&product=${p.id}`
                        )
                      }
                    >
                      <MessageCircle size={17} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full px-4"
                      onClick={() => setTarget(p)}
                    >
                      {t("mkt.offerAction")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {target && (
        <OfferDialog
          product={target}
          buyerId={user.id}
          buyerName={user.name}
          onClose={closeDialog}
        />
      )}
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