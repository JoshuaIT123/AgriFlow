"use client";

import Link from "next/link";
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
import { useMemo } from "react";
import { ProductBadge, OfferBadge, DealBadge } from "@/components/Badge";
import { PredictionPanel } from "@/components/PredictionPanel";

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

  return (
    <div className="container">
      <h2 style={{ marginBottom: 14, fontSize: 20 }}>
        {t("fdash.title")}, {user.name.split(" ")[0]} 👋
      </h2>

      <div className="balance-card">
        <div className="label">{t("wallet.balance")}</div>
        <div className="value mono">{formatRwf(data.balance)}</div>
        <div className="sub">
          {t("fdash.incoming")}:{" "}
          <strong className="mono">{formatRwf(data.incoming)}</strong>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <div className="num mono">{liveProducts.length}</div>
          <div className="lbl">{t("fdash.stat.products")}</div>
        </div>
        <div className="stat">
          <div className="num mono">{pendingOffers.length}</div>
          <div className="lbl">{t("fdash.stat.pendingOffers")}</div>
        </div>
        <div className="stat">
          <div className="num mono">{pendingDeals.length}</div>
          <div className="lbl">{t("fdash.stat.activeDeals")}</div>
        </div>
      </div>

      <div className="section-head">
        <h3>{t("fdash.products")}</h3>
        <Link href="/farmer/products" className="link-btn">
          {t("fdash.viewAll")} →
        </Link>
      </div>
      <div className="card">
        {data.products.length === 0 ? (
          <div className="empty">{t("fdash.empty")}</div>
        ) : (
          data.products.slice(0, 3).map((p) => (
            <div className="tx-row" key={p.id}>
              <div className="tx-icon">🌾</div>
              <div className="tx-main">
                <div className="tx-title">{p.title}</div>
                <div className="tx-sub">
                  {p.quantityKg} {t(unitKey(unitOf(p.unit)))} ·{" "}
                  {formatRwf(p.pricePerKg)}/{t(unitKey(unitOf(p.unit)))}
                </div>
              </div>
              <ProductBadge status={p.status} />
            </div>
          ))
        )}
      </div>

      <div className="section-head">
        <h3>{t("fdash.offers")}</h3>
        <Link href="/farmer/offers" className="link-btn">
          {t("fdash.viewAll")} →
        </Link>
      </div>
      <div className="card">
        {data.offers.length === 0 ? (
          <div className="empty">{t("offer.noOffers")}</div>
        ) : (
          data.offers.slice(0, 3).map((o) => (
            <div className="tx-row" key={o.id}>
              <div className="tx-icon">🤝</div>
              <div className="tx-main">
                <div className="tx-title">{o.buyerName}</div>
                <div className="tx-sub">
                  {formatRwf(o.pricePerKg)}/{t(unitKey(unitOf(o.unit)))} ·{" "}
                  {o.quantityKg} {t(unitKey(unitOf(o.unit)))}{" "}
                  {t("offer.on")} {o.productId.slice(0, 6)}
                </div>
              </div>
              <OfferBadge status={o.status} />
            </div>
          ))
        )}
      </div>

      <div className="section-head">
        <h3>{t("fdash.deals")}</h3>
        <Link href="/farmer/payments" className="link-btn">
          {t("fdash.viewAll")} →
        </Link>
      </div>
      <div className="card">
        {data.deals.length === 0 ? (
          <div className="empty">{t("deal.empty.farmer")}</div>
        ) : (
          data.deals.slice(0, 3).map((d) => (
            <div className="tx-row" key={d.id}>
              <div className="tx-icon">📦</div>
              <div className="tx-main">
                <div className="tx-title">{d.productTitle}</div>
                <div className="tx-sub">
                  {d.buyerName} ·{" "}
                  {formatDateShort(d.createdAt, displayLocale)}
                </div>
              </div>
              <div className="tx-side">
                <div className="tx-amount mono">{formatRwf(d.amountRwf)}</div>
                <div style={{ marginTop: 4 }}>
                  <DealBadge status={d.status} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <PredictionPanel />
    </div>
  );
}
