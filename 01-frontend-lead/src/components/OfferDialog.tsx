"use client";

import { useState, type FormEvent } from "react";
import { useI18n } from "@/lib/i18n-context";
import { placeOffer } from "@/lib/store";
import { bumpStore } from "@/lib/store-bus";
import { formatRwf } from "@/lib/format";
import { unitKey, unitOf } from "@/lib/units";
import type { Deal, Product } from "@/lib/types";
import { CircleAlert, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const p = Number(price);
    const q = Number(qty);
    if (!p || p <= 0 || !q || q <= 0 || q > product.quantityKg) {
      setError(t("auth.err.required"));
      return;
    }
    setBusy(true);
    const res = await placeOffer({
      productId: product.id,
      buyerId,
      buyerName,
      pricePerKg: p,
      quantityKg: q,
      message,
    });
    setBusy(false);
    bumpStore();
    // An offer meeting the asking price comes back with its trade already
    // open, so the caller can go straight to payment.
    onClose(res.ok ? "done" : "exists", res.deal);
  };

  const unit = t(unitKey(unitOf(product.unit)));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("offer.make.title")}</DialogTitle>
          <DialogDescription>
            {product.title} · {product.quantityKg} {unit} ·{" "}
            {formatRwf(product.pricePerKg)}/{unit}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            <CircleAlert size={17} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="oprice">{t("offer.make.price")}</Label>
              <Input
                id="oprice"
                type="number"
                inputMode="numeric"
                min="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="oqty">{t("offer.make.qty")}</Label>
              <Input
                id="oqty"
                type="number"
                inputMode="numeric"
                min="1"
                max={product.quantityKg}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="omsg">{t("offer.make.msg")}</Label>
            <Textarea
              id="omsg"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onClose()}
              disabled={busy}
            >
              {t("offer.make.cancel")}
            </Button>
            <Button type="submit" disabled={busy}>
              <Handshake size={16} aria-hidden />
              {busy ? t("common.loading") : t("offer.make.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}