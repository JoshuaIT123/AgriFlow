"use client";

import { useI18n } from "@/lib/i18n-context";
import type { DealStatus, OfferStatus, ProductStatus } from "@/lib/types";

const dealClass: Record<DealStatus, string> = {
  pending_delivery: "badge-pending",
  released: "badge-released",
  confirmed: "badge-released",
  auto_released: "badge-auto",
};

const offerClass: Record<OfferStatus, string> = {
  pending: "badge-pending",
  accepted: "badge-released",
  rejected: "badge-failed",
};

const productClass: Record<ProductStatus, string> = {
  available: "badge-released",
  sold: "badge-archived",
};

export function DealBadge({ status }: { status: DealStatus }) {
  const { t } = useI18n();
  return (
    <span className={`badge ${dealClass[status]}`}>
      <span className="dot" />
      {t(`deal.status.${status}`)}
    </span>
  );
}

export function OfferBadge({ status }: { status: OfferStatus }) {
  const { t } = useI18n();
  return (
    <span className={`badge ${offerClass[status]}`}>
      <span className="dot" />
      {t(`offer.status.${status}`)}
    </span>
  );
}

export function ProductBadge({ status }: { status: ProductStatus }) {
  const { t } = useI18n();
  return (
    <span className={`badge ${productClass[status]}`}>
      <span className="dot" />
      {t(`prod.status.${status}`)}
    </span>
  );
}
