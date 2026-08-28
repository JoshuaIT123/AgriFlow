"use client";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useStoreVersion } from "@/lib/store-bus";
import { getAvailableProducts } from "@/lib/store";
import type { Product } from "@/lib/types";
import { formatRwf } from "@/lib/format";
import { productIcon, unitKey, unitOf } from "@/lib/units";
import { OfferDialog } from "@/components/OfferDialog";
import { Toast } from "@/components/Toast";
export default function BuyerMarketplace() {
  const { user } = useAuth();
  const { t } = useI18n();
  const version = useStoreVersion();
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<Product | null>(null);
  const [toast, setToast] = useState<string | null>(null);
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
  const closeDialog = (result?: "done" | "exists") => {
    setTarget(null);
    if (result === "done") setToast(t("offer.make.done"));
    if (result === "exists") setToast(t("offer.make.exists"));
  };
  return (
    <div className="container">
      <h2 style={{ fontSize: 20, marginBottom: 6 }}>{t("mkt.title")}</h2>
      <p className="subtle" style={{ margin: "0 0 16px" }}>
        {t("mkt.subtitle")}
      </p>
      <input
        className="mkt-search"
        style={{
          width: "100%",
          minHeight: 50,
          borderRadius: 12,
          border: "1px solid var(--line)",
          padding: "0 16px",
          fontSize: 16,
          marginBottom: 14,
        }}
        placeholder={t("mkt.search")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label={t("mkt.search")}
      />
      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty">{query ? t("mkt.noResults") : t("mkt.empty")}</div>
        </div>
      ) : (
        <div className="mkt-grid">
          {filtered.map((p) => {
            // productIcon returns a component, not an element - render it.
            const Icon = productIcon(p.category, p.unit);
            return (
            <div className="product-card" key={p.id}>
              <div className="product-card-icon">
                <Icon size={28} aria-hidden />
              </div>
              <div className="product-card-title">{p.title}</div>
              <div className="product-card-sub">
                <strong>{p.farmerName}</strong>
                <br />
                {p.category} &middot; {p.quantityKg} {t(unitKey(unitOf(p.unit)))}
              </div>
              <div className="product-card-price">
                {formatRwf(p.pricePerKg)}/{t(unitKey(unitOf(p.unit)))}
              </div>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => setTarget(p)}
              >
                {t("mkt.offerAction")}
              </button>
            </div>
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
      <Toast message={toast} />
    </div>
  );
}
