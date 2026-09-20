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
import { CircleAlert, PackagePlus, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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

const selectClass =
  "h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50";

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

  const resetForm = () => {
    setTitle("");
    setQty("");
    setPrice("");
    setCategory(CATEGORIES[0]);
    setUnit("kg");
    setError(null);
  };

  const post = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const q = Number(qty);
    const p = Number(price);
    if (!title.trim() || !q || q <= 0 || !p || p <= 0) {
      setError(t("auth.err.required"));
      return;
    }
    const ok = await createProduct({
      farmerId: user.id,
      farmerName: user.name,
      title,
      category: t(category),
      quantityKg: q,
      pricePerKg: p,
      unit,
    });
    if (!ok) {
      setError(t("auth.err.required"));
      return;
    }
    resetForm();
    setShowForm(false);
    setToast(t("prod.posted"));
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t("prod.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("prod.subtitle")}</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="h-11">
          <PackagePlus size={16} aria-hidden />
          {t("prod.post")}
        </Button>
      </div>

      {/* List */}
      <Card className="gap-0 p-0">
        <CardContent className="p-0">
          {products.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Sprout size={24} aria-hidden />
              </span>
              <p className="text-sm text-muted-foreground">{t("prod.empty")}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowForm(true)}
              >
                <PackagePlus size={16} aria-hidden />
                {t("prod.post")}
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {products.map(({ product, offerCount }) => (
                <div
                  key={product.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Sprout size={18} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">
                      {product.title}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <span>
                        {product.category} · {product.quantityKg}{" "}
                        {t(unitKey(unitOf(product.unit)))} ·{" "}
                        {formatRwf(product.pricePerKg)}/
                        {t(unitKey(unitOf(product.unit)))}
                      </span>
                      <ProductBadge status={product.status} />
                      {product.status === "available" && offerCount > 0 && (
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 font-medium text-amber-700">
                          {offerCount} {t("prod.offers")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">
                      {formatRwf(product.pricePerKg * product.quantityKg)}
                    </span>
                    {product.status === "available" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setProductStatus(product.id, "sold")}
                      >
                        {t("prod.markSold")}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setProductStatus(product.id, "available")}
                      >
                        {t("prod.relist")}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Post dialog */}
      <Dialog open={showForm} onOpenChange={(o) => setShowForm(o)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("prod.post")}</DialogTitle>
            <DialogDescription>{t("prod.subtitle")}</DialogDescription>
          </DialogHeader>

          <form onSubmit={post} noValidate className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
                <CircleAlert size={17} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="ptitle">{t("prod.titleField")}</Label>
              <Input
                id="ptitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("prod.titleField")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pcat">{t("prod.category")}</Label>
              <select
                id="pcat"
                className={selectClass}
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="punit">{t("unit.quantity")}</Label>
                <select
                  id="punit"
                  className={selectClass}
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
              <div className="space-y-1.5">
                <Label htmlFor="pqty">{t("unit.quantity")}</Label>
                <Input
                  id="pqty"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pprice">{t("unit.price")}</Label>
              <Input
                id="pprice"
                type="number"
                inputMode="numeric"
                min="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
              >
                {t("prod.cancel")}
              </Button>
              <Button type="submit">{t("prod.submit")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Toast message={toast} />
    </div>
  );
}