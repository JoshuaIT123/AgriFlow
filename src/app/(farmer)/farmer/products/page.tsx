"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useStoreVersion } from "@/lib/store-bus";
import {
  createProduct,
  getProducts,
  getOffersForProduct,
  setProductStatus,
} from "@/lib/store";
import { formatRwf } from "@/lib/format";
import { unitKey, unitOf } from "@/lib/units";
import type { Unit } from "@/lib/types";
import { ProductBadge } from "@/components/Badge";
import { Toast } from "@/components/Toast";

const CATEGORIES = [
  "prod.category.tubers",
  "prod.category.cereals",
  "prod.category.legumes",
  "prod.category.cash",
  "prod.category.fruit",
  "prod.category.livestock",
  "prod.category.poultry",
  "prod.category.dairy",
  "prod.category.other",
] as const;

const UNITS: Unit[] = ["kg", "head", "litre", "unit", "dozen", "crate", "bunch"];

export default function FarmerProducts() {
  const { user } = useAuth();
  const { t } = useI18n();
  const version = useStoreVersion();
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [unit, setUnit] = useState<Unit>("kg");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);

  const products = useMemo(() => {
    if (!user) return [];
    return getProducts(user.id).map((p) => ({
      product: p,
      offerCount: getOffersForProduct(p.id).filter((o) => o.status === "pending").length,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, version]);

  if (!user) return null;

  const post = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const q = Number(qty);
    const p = Number(price);
    if (!title.trim() || !q || q <= 0 || !p || p <= 0) {
      setError(t("auth.err.required"));
      return;
    }
    createProduct({
      farmerId: user.id,
      farmerName: user.name,
      title,
      category: t(category),
      quantityKg: q,
      pricePerKg: p,
      unit,
    });
    setTitle("");
    setQty("");
    setPrice("");
    setCategory(CATEGORIES[0]);
    setUnit("kg");
    setShowForm(false);
    setToast(t("prod.posted"));
  };

  return (
    <div className="container">
      <div className="section-head" style={{ marginTop: 0 }}>
        <div>
          <h2 style={{ fontSize: 20, margin: 0 }}>{t("prod.title")}</h2>
          <p className="subtle" style={{ margin: "4px 0 0" }}>
            {t("prod.subtitle")}
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm((v) => !v)}>
          + {t("prod.post")}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <form onSubmit={post} noValidate>
            <div className="field">
              <label htmlFor="ptitle">{t("prod.titleField")}</label>
              <input
                id="ptitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="pcat">{t("prod.category")}</label>
              <select
                id="pcat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(c)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="punit">{t("unit.quantity")}</label>
              <select
                id="punit"
                value={unit}
                onChange={(e) => setUnit(e.target.value as Unit)}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {t(unitKey(u))}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="pqty">{t("unit.quantity")}</label>
              <input
                id="pqty"
                type="number"
                inputMode="numeric"
                min="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="pprice">{t("unit.price")}</label>
              <input
                id="pprice"
                type="number"
                inputMode="numeric"
                min="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            {error && <div className="form-error">{error}</div>}
            <div className="row" style={{ gap: 10 }}>
              <button className="btn btn-ghost" type="button" onClick={() => setShowForm(false)}>
                {t("prod.cancel")}
              </button>
              <button className="btn btn-primary btn-block" type="submit">
                {t("prod.submit")}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {products.length === 0 ? (
          <div className="empty">{t("prod.empty")}</div>
        ) : (
          products.map(({ product, offerCount }) => (
            <div className="tx-row" key={product.id}>
              <div className="tx-icon">🌾</div>
              <div className="tx-main">
                <div className="tx-title">{product.title}</div>
                <div className="tx-sub">
                  {product.category} · {product.quantityKg} {t(unitKey(unitOf(product.unit)))}{" "}
                  · {formatRwf(product.pricePerKg)}/{t(unitKey(unitOf(product.unit)))}
                </div>
                <div style={{ marginTop: 6 }}>
                  <ProductBadge status={product.status} />
                  {product.status === "available" && offerCount > 0 && (
                    <span className="badge badge-pending" style={{ marginLeft: 6 }}>
                      {offerCount} {t("prod.offers")}
                    </span>
                  )}
                </div>
              </div>
              <div className="tx-side">
                <div className="tx-amount mono">{formatRwf(product.pricePerKg * product.quantityKg)}</div>
                {product.status === "available" ? (
                  <button
                    className="btn btn-sm btn-ghost"
                    style={{ marginTop: 8 }}
                    onClick={() => {
                      setProductStatus(product.id, "sold");
                    }}
                  >
                    {t("prod.markSold")}
                  </button>
                ) : (
                  <button
                    className="btn btn-sm btn-secondary"
                    style={{ marginTop: 8 }}
                    onClick={() => {
                      setProductStatus(product.id, "available");
                    }}
                  >
                    {t("prod.relist")}
                  </button>
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
