"use client";

import { useI18n } from "@/lib/i18n-context";
import { confirmDelivery } from "@/lib/store";
import { bumpStore } from "@/lib/store-bus";
import { formatCountdown, formatDate, formatRwf, hoursUntil } from "@/lib/format";
import { unitKey, unitOf } from "@/lib/units";
import { Package } from "lucide-react";
import type { Deal } from "@/lib/types";
import { DealBadge } from "./Badge";

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
    <div className="tx-row">
      <div className="tx-icon" aria-hidden><Package size={22} /></div>
      <div className="tx-main">
        <div className="tx-title">{deal.productTitle}</div>
        <div className="tx-sub">
          {confirmableBy === "farmer"
            ? `${t("deal.from")} ${deal.buyerName}`
            : `${t("deal.to")} ${deal.farmerName}`}{" "}
          · {deal.quantityKg} {t(unitKey(unitOf(deal.unit)))} ·{" "}
          {deal.hasConditionalSettlement ? "escrow" : "direct"}
        </div>
        <div style={{ marginTop: 6 }}>
          <DealBadge status={deal.status} />
        </div>
      </div>
      <div className="tx-side">
        <div className="tx-amount mono">{formatRwf(deal.amountRwf)}</div>
        <div className="tx-meta">
          {formatDate(deal.createdAt, locale === "rw" ? "en" : locale)}
        </div>
        {showCountdown && (
          <div
            className="tx-meta mono"
            style={{ color: "var(--warning)", fontWeight: 700 }}
          >
            {formatCountdown(t("deal.countdown"), leftover)}
          </div>
        )}
        {canConfirm && deal.status === "pending_delivery" && (
          <button
            className="btn btn-sm btn-primary"
            style={{ marginTop: 8 }}
            onClick={handleConfirm}
          >
            {confirmableBy === "farmer"
              ? t("deal.confirm")
              : t("deal.confirmByBuyer")}
          </button>
        )}
      </div>
    </div>
  );
}
