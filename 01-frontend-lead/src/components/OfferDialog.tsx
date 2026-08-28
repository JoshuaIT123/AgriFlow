"use client";

import { useState, type FormEvent } from "react";
import { useI18n } from "@/lib/i18n-context";
import { placeOffer } from "@/lib/store";
import { bumpStore } from "@/lib/store-bus";
import { formatRwf } from "@/lib/format";
import { unitKey, unitOf } from "@/lib/units";
import type { Deal, Product } from "@/lib/types";

export function OfferDialog({
  product,
  buyerId,
  buyerName,
  onClose,
}: {
  product: Product;
  buyerId: string;
  buyerName: string;
  onClose: (result?: "done" | "exists", deal?: Deal | null) => void;
}) {
  const { t } = useI18n();
  const [price, setPrice] = useState(String(product.pricePerKg));
  const [qty, setQty] = useState(String(Math.min(product.quantityKg, 100)));
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const p = Number(price);
    const q = Number(qty);
    if (!p || p <= 0 || !q || q <= 0 || q > product.quantityKg) {
      setError(t("auth.err.required"));
      return;
    }
    const res = await placeOffer({
      productId: product.id,
      buyerId,
      buyerName,
      pricePerKg: p,
      quantityKg: q,
      message,
    });
    bumpStore();
    // An offer meeting the asking price comes back with its trade already
    // open, so the caller can go straight to payment.
    onClose(res.ok ? "done" : "exists", res.deal);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(21,36,28,0.5)",
        display: "grid",
        placeItems: "end center",
        zIndex: 60,
        padding: 0,
      }}
      onClick={() => onClose()}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 480,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          boxShadow: "var(--shadow-md)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 2 }}>{t("offer.make.title")}</h3>
        <p className="subtle" style={{ margin: "0 0 4px" }}>
          {product.title} · {product.quantityKg} {t(unitKey(unitOf(product.unit)))}{" "}
          · {formatRwf(product.pricePerKg)}/{t(unitKey(unitOf(product.unit)))}
        </p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="oprice">
              {t("offer.make.price")}
            </label>
            <input
              id="oprice"
              type="number"
              inputMode="numeric"
              min="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="oqty">{t("offer.make.qty")}</label>
            <input
              id="oqty"
              type="number"
              inputMode="numeric"
              min="1"
              max={product.quantityKg}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="omsg">{t("offer.make.msg")}</label>
            <input
              id="omsg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <div className="row" style={{ gap: 10 }}>
            <button className="btn btn-ghost" type="button" onClick={() => onClose()}>
              {t("offer.make.cancel")}
            </button>
            <button className="btn btn-primary btn-block" type="submit">
              {t("offer.make.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
