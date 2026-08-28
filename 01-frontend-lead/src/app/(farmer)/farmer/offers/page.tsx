"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useStoreVersion } from "@/lib/store-bus";
import {
  getProducts,
  getOffersReceivedByFarmer,
  respondToOffer,
} from "@/lib/store";
import { formatRwf } from "@/lib/format";
import { unitKey, unitOf } from "@/lib/units";
import { OfferBadge } from "@/components/Badge";
import { Handshake } from "lucide-react";
import { Toast } from "@/components/Toast";
import { useState } from "react";

export default function FarmerOffers() {
  const { user } = useAuth();
  const { t } = useI18n();
  const version = useStoreVersion();
  const [toast, setToast] = useState<string | null>(null);

  const rows = useMemo(() => {
    if (!user) return [];
    const products = getProducts(user.id);
    const titleByProduct = new Map(products.map((p) => [p.id, p.title]));
    return getOffersReceivedByFarmer(user.id).map((o) => ({
      offer: o,
      productTitle: titleByProduct.get(o.productId) ?? o.productId.slice(0, 6),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, version]);

  if (!user) return null;

  const handleRespond = async (offerId: string, response: "accepted" | "rejected") => {
    const res = await respondToOffer(offerId, response);
    if (res === "ok") {
      setToast(response === "accepted" ? t("offer.accepted.msg") : t("offer.rejected.msg"));
    }
  };

  return (
    <div className="container">
      <h2 style={{ fontSize: 20, marginBottom: 6 }}>{t("offer.recv.title")}</h2>
      <p className="subtle" style={{ margin: "0 0 16px" }}>
        {t("offer.recv.subtitle")}
      </p>

      <div className="card">
        {rows.length === 0 ? (
          <div className="empty">{t("offer.noOffers")}</div>
        ) : (
          rows.map(({ offer, productTitle }) => (
            <div className="tx-row" key={offer.id}>
              <div className="tx-icon" aria-hidden><Handshake size={22} /></div>
              <div className="tx-main">
                <div className="tx-title">{offer.buyerName}</div>
                <div className="tx-sub">
                  {t("offer.on")} {productTitle} ·{" "}
                  {formatRwf(offer.pricePerKg)}/{t(unitKey(unitOf(offer.unit)))} ·{" "}
                  {offer.quantityKg} {t(unitKey(unitOf(offer.unit)))}
                </div>
                {offer.message && (
                  <div className="tx-sub" style={{ marginTop: 4, fontStyle: "italic" }}>
                    “{offer.message}”
                  </div>
                )}
                <div style={{ marginTop: 6 }}>
                  <OfferBadge status={offer.status} />
                </div>
              </div>
              <div className="tx-side">
                <div className="tx-amount mono">
                  {formatRwf(offer.quantityKg * offer.pricePerKg)}
                </div>
                {offer.status === "pending" && (
                  <div className="row" style={{ justifyContent: "flex-end", gap: 6, marginTop: 8 }}>
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => handleRespond(offer.id, "rejected")}
                    >
                      {t("offer.reject")}
                    </button>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleRespond(offer.id, "accepted")}
                    >
                      {t("offer.accept")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Toast message={toast} />
    </div>
  );
}
