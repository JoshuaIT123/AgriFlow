"use client";

import { useI18n } from "@/lib/i18n-context";
import { confirmDelivery } from "@/lib/store";
import { bumpStore } from "@/lib/store-bus";
import { formatCountdown, formatDate, formatRwf, hoursUntil } from "@/lib/format";
import { unitKey, unitOf } from "@/lib/units";
import { Check, Package } from "lucide-react";
import type { Deal } from "@/lib/types";
import { DealBadge } from "./Badge";
import { Button } from "@/components/ui/button";

function releaseDeadline(deal: Deal): string {
  return new Date(
    new Date(deal.createdAt).getTime() + deal.autoReleaseInHours * 3600_000
  ).toISOString();
}

export function DealRow({
  deal,
  confirmableBy,
  onConfirm,
}: {
  deal: Deal;
  confirmableBy?: "farmer" | "buyer";
  onConfirm?: () => void;
}) {
  const { t, locale } = useI18n();
  const leftover = hoursUntil(releaseDeadline(deal));
  const showCountdown =
    deal.status === "pending_delivery" || deal.status === "released";
  const canConfirm = (confirmableBy ?? "buyer") === "buyer";

  const handleConfirm = async () => {
    if (await confirmDelivery(deal.id)) {
      bumpStore();
      if (onConfirm) onConfirm();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 py-3.5">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Package size={19} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{deal.productTitle}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {confirmableBy === "farmer"
            ? `${t("deal.from")} ${deal.buyerName}`
            : `${t("deal.to")} ${deal.farmerName}`}{" "}
          · {deal.quantityKg} {t(unitKey(unitOf(deal.unit)))} ·{" "}
          {deal.hasConditionalSettlement ? "escrow" : "direct"}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <DealBadge status={deal.status} />
          {showCountdown && (
            <span className="font-mono text-xs font-bold text-amber-600">
              {formatCountdown(t("deal.countdown"), leftover)}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className="font-mono text-sm font-bold">
          {formatRwf(deal.amountRwf)}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatDate(deal.createdAt, locale === "rw" ? "en" : locale)}
        </span>
        {canConfirm && deal.status === "pending_delivery" && (
          <Button
            size="sm"
            onClick={handleConfirm}
          >
            <Check size={14} aria-hidden />
            {confirmableBy === "farmer"
              ? t("deal.confirm")
              : t("deal.confirmByBuyer")}
          </Button>
        )}
      </div>
    </div>
  );
}