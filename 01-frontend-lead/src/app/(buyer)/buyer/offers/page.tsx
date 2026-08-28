"use client";

import { useMemo, useState } from "react";
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
import { Handshake } from "lucide-react";

export default function BuyerOffers() {
  const { user } = useAuth();
  const { t } = useI18n();
  const version = useStoreVersion();
  const [payDeal, setPayDeal] = useState<Deal | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const rows = useMemo(() => {
    if (!user) return [];
    const all = getProducts();
    const title = new Map(all.map((p) => [p.id, p.title]));
    return getMyOffers(user.id).map((o) => ({
      offer: o,
      productTitle: title.get(o.productId) ?? o.productId.slice(0, 6),
      // Present only while the opened trade still awaits payment.
      deal: getDealForOffer(o.id),
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
          rows.map(({ offer, productTitle, deal }) => {
            const payable = deal?.tradeStatus === "AGREED";
            return (
            <div
              className="tx-row"
              key={offer.id}
              onClick={() => payable && deal && setPayDeal(deal)}
              role={payable ? "button" : undefined}
              tabIndex={payable ? 0 : undefined}
              style={payable ? { cursor: "pointer" } : undefined}
            >
              <div className="tx-icon" aria-hidden><Handshake size={22} /></div>
              <div className="tx-main">
                <div className="tx-title">{productTitle}</div>
                <div className="tx-sub">
                  {formatRwf(offer.pricePerKg)}/{t(unitKey(unitOf(offer.unit)))} ·{" "}
                  {offer.quantityKg} {t(unitKey(unitOf(offer.unit)))}
                </div>
                <div style={{ marginTop: 6 }}>
                  <OfferBadge status={offer.status} />
                  {payable && (
                    <span className="badge badge-ok" style={{ marginLeft: 6 }}>
                      {t("offer.tapToPay")}
                    </span>
                  )}
                </div>
              </div>
              <div className="tx-side">
                <div className="tx-amount mono">
                  {formatRwf(offer.quantityKg * offer.pricePerKg)}
                </div>
              </div>
            </div>
            );
          })
        )}
      </div>

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
