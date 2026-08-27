"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useStoreVersion } from "@/lib/store-bus";
import { getDealsForBuyer } from "@/lib/store";
import { DealRow } from "@/components/DealRow";
import { Toast } from "@/components/Toast";

type Filter = "all" | "pending" | "done";

export default function BuyerPayments() {
  const { user } = useAuth();
  const { t } = useI18n();
  const version = useStoreVersion();
  const [filter, setFilter] = useState<Filter>("all");
  const [toast, setToast] = useState<string | null>(null);

  const deals = useMemo(() => {
    if (!user) return [];
    return getDealsForBuyer(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, version]);

  if (!user) return null;

  const pending = deals.filter((d) => d.status === "pending_delivery");
  const done = deals.filter(
    (d) =>
      d.status === "confirmed" ||
      d.status === "released" ||
      d.status === "auto_released"
  );
  const shown = filter === "all" ? deals : filter === "pending" ? pending : done;

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: t("deal.filter.all"), count: deals.length },
    { key: "pending", label: t("deal.filter.pending"), count: pending.length },
    { key: "done", label: t("deal.filter.done"), count: done.length },
  ];

  return (
    <div className="container">
      <h2 style={{ fontSize: 20, marginBottom: 6 }}>{t("deal.buyer.title")}</h2>
      <p className="subtle" style={{ margin: "0 0 16px" }}>
        {t("deal.buyer.subtitle")}
      </p>

      <div
        className="row"
        style={{
          gap: 8,
          marginBottom: 12,
          justifyContent: "flex-start",
          flexWrap: "wrap",
        }}
      >
        {filters.map((f) => (
          <button
            key={f.key}
            className={`btn btn-sm ${filter === f.key ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      <div className="card">
        {shown.length === 0 ? (
          <div className="empty">{t("deal.empty.buyer")}</div>
        ) : (
          shown.map((deal) => (
            <DealRow
              key={deal.id}
              deal={deal}
              confirmableBy="buyer"
              onConfirm={() => setToast(t("deal.confirmedMsg"))}
            />
          ))
        )}
      </div>

      <Toast message={toast} />
    </div>
  );
}
