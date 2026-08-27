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
import { DealBadge, OfferBadge } from "@/components/Badge";

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

  return (
    <div className="container">
      <h2 style={{ marginBottom: 14, fontSize: 20 }}>
        {t("nav.dashboard")}, {user.name.split(" ")[0]} 👋
      </h2>

      <div className="balance-card">
        <div className="label">{t("wallet.balance")}</div>
        <div className="value mono">{formatRwf(data.balance)}</div>
        <div className="sub">
          {t("wallet.escrow")}:{" "}
          <strong className="mono">{formatRwf(data.held)}</strong>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <div className="num mono">{data.products.length}</div>
          <div className="lbl">{t("mkt.title")}</div>
        </div>
        <div className="stat">
          <div className="num mono">{pendingOffers.length}</div>
          <div className="lbl">{t("offer.status.pending")}</div>
        </div>
        <div className="stat">
          <div className="num mono">{pendingDeals.length}</div>
          <div className="lbl">{t("deal.filter.pending")}</div>
        </div>
      </div>

      <div className="section-head">
        <h3>{t("mkt.title")}</h3>
        <Link href="/buyer/marketplace" className="link-btn">
          {t("fdash.viewAll")} →
        </Link>
      </div>
      <div className="card">
        {data.products.length === 0 ? (
          <div className="empty">{t("mkt.empty")}</div>
        ) : (
          data.products.slice(0, 3).map((p) => (
            <div className="tx-row" key={p.id}>
              <div className="tx-icon">🌾</div>
              <div className="tx-main">
                <div className="tx-title">{p.title}</div>
                <div className="tx-sub">
                  {p.farmerName} · {p.quantityKg} {t(unitKey(unitOf(p.unit)))} ·{" "}
                  {formatRwf(p.pricePerKg)}/{t(unitKey(unitOf(p.unit)))}
                </div>
              </div>
              <div className="tx-amount mono">{formatRwf(p.pricePerKg)}/{t(unitKey(unitOf(p.unit)))}</div>
            </div>
          ))
        )}
      </div>

      <div className="section-head">
        <h3>{t("offer.sent.title")}</h3>
        <Link href="/buyer/offers" className="link-btn">
          {t("fdash.viewAll")} →
        </Link>
      </div>
      <div className="card">
        {data.offers.length === 0 ? (
          <div className="empty">{t("offer.noSent")}</div>
        ) : (
          data.offers.slice(0, 3).map((o) => (
            <div className="tx-row" key={o.id}>
              <div className="tx-icon">🤝</div>
              <div className="tx-main">
                <div className="tx-title">
                  {data.productTitle.get(o.productId) ?? o.productId.slice(0, 6)}
                </div>
                <div className="tx-sub">
                  {formatRwf(o.pricePerKg)}/{t(unitKey(unitOf(o.unit)))} · {o.quantityKg}{" "}
                  {t(unitKey(unitOf(o.unit)))}
                </div>
              </div>
              <OfferBadge status={o.status} />
            </div>
          ))
        )}
      </div>

      <div className="section-head">
        <h3>{t("fdash.deals")}</h3>
        <Link href="/buyer/payments" className="link-btn">
          {t("fdash.viewAll")} →
        </Link>
      </div>
      <div className="card">
        {data.deals.length === 0 ? (
          <div className="empty">{t("deal.empty.buyer")}</div>
        ) : (
          data.deals.slice(0, 3).map((d) => (
            <div className="tx-row" key={d.id}>
              <div className="tx-icon">📦</div>
              <div className="tx-main">
                <div className="tx-title">{d.productTitle}</div>
                <div className="tx-sub">
                  {d.farmerName} · {formatDateShort(d.createdAt, displayLocale)}
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
