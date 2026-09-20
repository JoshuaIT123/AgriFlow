"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import { Handshake, MessageCircle, X, BadgeCheck } from "lucide-react";
import { Toast } from "@/components/Toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

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

  const handleRespond = async (
    offerId: string,
    response: "accepted" | "rejected"
  ) => {
    const res = await respondToOffer(offerId, response);
    if (res === "ok") {
      setToast(
        response === "accepted"
          ? t("offer.accepted.msg")
          : t("offer.rejected.msg")
      );
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t("offer.recv.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("offer.recv.subtitle")}
        </p>
      </div>

      <Card className="gap-0 p-0">
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-600">
                <Handshake size={24} aria-hidden />
              </span>
              <p className="text-sm text-muted-foreground">{t("offer.noOffers")}</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {rows.map(({ offer, productTitle }) => (
                <div
                  key={offer.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
                    <Handshake size={18} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">
                      {offer.buyerName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("offer.on")} {productTitle} ·{" "}
                      {formatRwf(offer.pricePerKg)}/
                      {t(unitKey(unitOf(offer.unit)))} · {offer.quantityKg}{" "}
                      {t(unitKey(unitOf(offer.unit)))}
                    </div>
                    {offer.message && (
                      <div className="mt-0.5 italic text-xs text-muted-foreground">
                        “{offer.message}”
                      </div>
                    )}
                    <div className="mt-1">
                      <OfferBadge status={offer.status} />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-mono text-sm font-semibold">
                      {formatRwf(offer.quantityKg * offer.pricePerKg)}
                    </span>
                    <div className="flex gap-2">
                      {offer.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRespond(offer.id, "rejected")}
                          >
                            <X size={14} aria-hidden />
                            {t("offer.reject")}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleRespond(offer.id, "accepted")}
                          >
                            <BadgeCheck size={14} aria-hidden />
                            {t("offer.accept")}
                          </Button>
                        </>
                      )}
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        title={t("chat.contact")}
                      >
                        <Link
                          href={`/chat?with=${offer.buyerId}&name=${encodeURIComponent(
                            offer.buyerName || ""
                          )}&product=${offer.productId}`}
                        >
                          <MessageCircle size={14} aria-hidden />
                          {t("chat.contact")}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Toast message={toast} />
    </div>
  );
}