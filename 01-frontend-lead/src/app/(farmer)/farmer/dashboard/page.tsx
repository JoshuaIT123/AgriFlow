"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useStoreVersion } from "@/lib/store-bus";
import {
  getDealsForFarmer,
  getOffersReceivedByFarmer,
  getProducts,
  walletBalance,
} from "@/lib/store";
import { formatDateShort, formatRwf } from "@/lib/format";
import { unitKey, unitOf } from "@/lib/units";
import {
  ArrowRight,
  Handshake,
  Loader,
  Package,
  Plus,
  Sprout,
  TrendingUp,
  Wallet,
  Wheat,
} from "lucide-react";
import { ProductBadge, OfferBadge, DealBadge } from "@/components/Badge";
import { PredictionPanel } from "@/components/PredictionPanel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function FarmerDashboard() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const version = useStoreVersion();
  const displayLocale = locale === "rw" ? "en" : locale;

  const data = useMemo(() => {
    if (!user) return null;
    const deals = getDealsForFarmer(user.id);
    return {
      products: getProducts(user.id),
      offers: getOffersReceivedByFarmer(user.id),
      deals,
      balance: walletBalance(user.id),
      incoming: deals
        .filter((d) => d.status === "pending_delivery")
        .reduce((sum, d) => sum + d.amountRwf, 0),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, version]);

  if (!user || !data) return null;

  const pendingOffers = data.offers.filter((o) => o.status === "pending");
  const pendingDeals = data.deals.filter(
    (d) => d.status === "pending_delivery"
  );
  const liveProducts = data.products.filter((p) => p.status === "available");

  const today = new Date().toLocaleDateString(displayLocale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const stats = [
    { icon: Wheat, value: liveProducts.length, label: t("fdash.stat.products") },
    { icon: Handshake, value: pendingOffers.length, label: t("fdash.stat.pendingOffers") },
    { icon: Package, value: pendingDeals.length, label: t("fdash.stat.activeDeals") },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">
          {t("nav.dashboard")}
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          {t("fdash.title")}, {user.name.split(" ")[0]}
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
                <TrendingUp size={13} aria-hidden />
                {t("fdash.incoming")}:{" "}
                <span className="font-mono font-semibold">
                  {formatRwf(data.incoming)}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Button
                asChild
                variant="secondary"
                className="h-11 bg-white text-emerald-950 hover:bg-lime-50"
              >
                <Link href="/farmer/products">
                  <Plus size={16} aria-hidden />
                  {t("prod.post")}
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="h-11 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/farmer/wallet">
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

      {/* Products + Offers */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Products */}
        <Card className="gap-0 p-0">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">{t("fdash.products")}</CardTitle>
            <Link
              href="/farmer/products"
              className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              {t("fdash.viewAll")}
              <ArrowRight size={14} aria-hidden />
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {data.products.length === 0 ? (
              <div className="rounded-xl bg-accent/60 px-4 py-6 text-center text-sm text-muted-foreground">
                {t("fdash.empty")}
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {data.products.slice(0, 3).map((p) => (
                  <div key={p.id} className="flex items-center gap-3 py-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Sprout size={18} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">
                        {p.title}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {p.quantityKg} {t(unitKey(unitOf(p.unit)))} ·{" "}
                        {formatRwf(p.pricePerKg)}/{t(unitKey(unitOf(p.unit)))}
                      </div>
                    </div>
                    <ProductBadge status={p.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Offers */}
        <Card className="gap-0 p-0">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">{t("fdash.offers")}</CardTitle>
            <Link
              href="/farmer/offers"
              className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              {t("fdash.viewAll")}
              <ArrowRight size={14} aria-hidden />
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {data.offers.length === 0 ? (
              <div className="rounded-xl bg-accent/60 px-4 py-6 text-center text-sm text-muted-foreground">
                {t("offer.noOffers")}
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
                        {o.buyerName}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {formatRwf(o.pricePerKg)}/
                        {t(unitKey(unitOf(o.unit)))} · {o.quantityKg}{" "}
                        {t(unitKey(unitOf(o.unit)))} · {o.productId.slice(0, 6)}
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
            href="/farmer/payments"
            className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            {t("fdash.viewAll")}
            <ArrowRight size={14} aria-hidden />
          </Link>
        </CardHeader>
        <CardContent className="pt-0">
          {data.deals.length === 0 ? (
            <div className="rounded-xl bg-accent/60 px-4 py-6 text-center text-sm text-muted-foreground">
              {t("deal.empty.farmer")}
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
                      {d.buyerName} ·{" "}
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

      <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Loader size={13} aria-hidden />
        {t("auth.demo.hint")}
      </p>
    </div>
  );
}
