"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { PredictionPanel } from "@/components/PredictionPanel";
import { useStoreVersion } from "@/lib/store-bus";
import {
  getDealsForBuyer,
  getAvailableProducts,
  getMyOffers,
  getProducts,
  walletBalance,
  walletHeld,
} from "@/lib/store";
import { formatDateShort, formatRwf } from "@/lib/format";
import { unitKey, unitOf } from "@/lib/units";
import {
  ArrowRight,
  Clock3,
  Handshake,
  LockKeyhole,
  Package,
  ShoppingBasket,
  Wallet,
  Wheat,
} from "lucide-react";
import { DealBadge, OfferBadge } from "@/components/Badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function BuyerDashboard() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const version = useStoreVersion();
  const displayLocale = locale === "rw" ? "en" : locale;

  const data = useMemo(() => {
    if (!user) return null;
    const productTitle = new Map(getProducts().map((p) => [p.id, p.title]));
    return {
      deals: getDealsForBuyer(user.id),
      products: getAvailableProducts(),
      offers: getMyOffers(user.id),
      productTitle,
      balance: walletBalance(user.id),
      held: walletHeld(user.id),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, version]);

  if (!user || !data) return null;

  const pendingDeals = data.deals.filter((d) => d.status === "pending_delivery");
  const pendingOffers = data.offers.filter((o) => o.status === "pending");

  const today = new Date().toLocaleDateString(displayLocale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const stats = [
    { icon: ShoppingBasket, value: data.products.length, label: t("mkt.title") },
    { icon: Handshake, value: pendingOffers.length, label: t("offer.status.pending") },
    { icon: Clock3, value: pendingDeals.length, label: t("deal.filter.pending") },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting header */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">
          {t("nav.dashboard")}
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          {t("nav.dashboard")}, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{today}</p>
      </div>

      {/* Balance hero */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#08301f] via-[#0d4a2d] to-[#146b3d] text-white shadow-lg shadow-emerald-950/20">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-medium text-white/70">
                {t("wallet.balance")}
              </div>
              <div className="mt-1 font-mono text-3xl font-bold tracking-tight sm:text-4xl">
                {formatRwf(data.balance)}
              </div>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-lime-300">
                <LockKeyhole size={13} aria-hidden />
                {t("wallet.escrow")}:{" "}
                <span className="font-mono font-semibold">
                  {formatRwf(data.held)}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Button
                asChild
                variant="secondary"
                className="h-11 bg-white text-emerald-950 hover:bg-lime-50"
              >
                <Link href="/buyer/marketplace">
                  <ShoppingBasket size={16} aria-hidden />
                  {t("mkt.title")}
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="h-11 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/buyer/wallet">
                  <Wallet size={16} aria-hidden />
                  {t("wallet.title")}
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="gap-0 p-0">
              <CardContent className="flex items-center gap-3.5 p-4 sm:p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon size={20} aria-hidden />
                </span>
                <div>
                  <div className="font-mono text-2xl font-bold leading-none tracking-tight">
                    {s.value}
                  </div>
                  <div className="mt-1 text-xs font-medium text-muted-foreground">
                    {s.label}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Marketplace + Offers */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Marketplace */}
        <Card className="gap-0 p-0">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">{t("mkt.title")}</CardTitle>
            <Link
              href="/buyer/marketplace"
              className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              {t("fdash.viewAll")}
              <ArrowRight size={14} aria-hidden />
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {data.products.length === 0 ? (
              <div className="rounded-xl bg-accent/60 px-4 py-6 text-center text-sm text-muted-foreground">
                {t("mkt.empty")}
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {data.products.slice(0, 3).map((p) => (
                  <div key={p.id} className="flex items-center gap-3 py-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Wheat size={18} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">
                        {p.title}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {p.farmerName} · {p.quantityKg}{" "}
                        {t(unitKey(unitOf(p.unit)))} ·{" "}
                        {formatRwf(p.pricePerKg)}/{t(unitKey(unitOf(p.unit)))}
                      </div>
                    </div>
                    <div className="font-mono text-sm font-semibold text-foreground">
                      {formatRwf(p.pricePerKg)}/{t(unitKey(unitOf(p.unit)))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sent offers */}
        <Card className="gap-0 p-0">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">{t("offer.sent.title")}</CardTitle>
            <Link
              href="/buyer/offers"
              className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              {t("fdash.viewAll")}
              <ArrowRight size={14} aria-hidden />
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {data.offers.length === 0 ? (
              <div className="rounded-xl bg-accent/60 px-4 py-6 text-center text-sm text-muted-foreground">
                {t("offer.noSent")}
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {data.offers.slice(0, 3).map((o) => (
                  <div key={o.id} className="flex items-center gap-3 py-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
                      <Handshake size={18} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">
                        {data.productTitle.get(o.productId) ??
                          o.productId.slice(0, 6)}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {formatRwf(o.pricePerKg)}/{t(unitKey(unitOf(o.unit)))}{" "}
                        · {o.quantityKg} {t(unitKey(unitOf(o.unit)))}
                      </div>
                    </div>
                    <OfferBadge status={o.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Deals */}
      <Card className="gap-0 p-0">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">{t("fdash.deals")}</CardTitle>
          <Link
            href="/buyer/payments"
            className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            {t("fdash.viewAll")}
            <ArrowRight size={14} aria-hidden />
          </Link>
        </CardHeader>
        <CardContent className="pt-0">
          {data.deals.length === 0 ? (
            <div className="rounded-xl bg-accent/60 px-4 py-6 text-center text-sm text-muted-foreground">
              {t("deal.empty.buyer")}
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {data.deals.slice(0, 3).map((d) => (
                <div key={d.id} className="flex items-center gap-3 py-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Package size={18} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">
                      {d.productTitle}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {d.farmerName} ·{" "}
                      {formatDateShort(d.createdAt, displayLocale)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-semibold">
                      {formatRwf(d.amountRwf)}
                    </div>
                    <div className="mt-1">
                      <DealBadge status={d.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI outlook */}
      <PredictionPanel />
    </div>
  );
}
