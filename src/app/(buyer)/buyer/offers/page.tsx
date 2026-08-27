"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useStoreVersion } from "@/lib/store-bus";
import { getMyOffers, getProducts } from "@/lib/store";
import { formatRwf } from "@/lib/format";
import { unitKey, unitOf } from "@/lib/units";
import { OfferBadge } from "@/components/Badge";

export default function BuyerOffers() {
  const { user } = useAuth();
  const { t } = useI18n();
  const version = useStoreVersion();

  const rows = useMemo(() => {
    if (!user) return [];
    const all = getProducts();
    const title = new Map(all.map((p) => [p.id, p.title]));
    return getMyOffers(user.id).map((o) => ({
      offer: o,
      productTitle: title.get(o.productId) ?? o.productId.slice(0, 6),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, version]);

  if (!user) return null;

  return (
    <div className="container">
      <h2 style={{ fontSize: 20, marginBottom: 6 }}>{t("offer.sent.title")}</h2>
      <p className="subtle" style={{ margin: "0 0 16px" }}>
        {t("offer.sent.subtitle")}
      </p>

      <div className="card">
        {rows.length === 0 ? (
          <div className="empty">{t("offer.noSent")}</div>
        ) : (
          rows.map(({ offer, productTitle }) => (
            <div className="tx-row" key={offer.id}>
              <div className="tx-icon">🤝</div>
              <div className="tx-main">
                <div className="tx-title">{productTitle}</div>
                <div className="tx-sub">
                  {formatRwf(offer.pricePerKg)}/{t(unitKey(unitOf(offer.unit)))} ·{" "}
                  {offer.quantityKg} {t(unitKey(unitOf(offer.unit)))}
                </div>
                <div style={{ marginTop: 6 }}>
                  <OfferBadge status={offer.status} />
                </div>
              </div>
              <div className="tx-side">
                <div className="tx-amount mono">
                  {formatRwf(offer.quantityKg * offer.pricePerKg)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
