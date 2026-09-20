"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useStoreVersion } from "@/lib/store-bus";
import { getDealsForFarmer } from "@/lib/store";
import { DealRow } from "@/components/DealRow";
import { Toast } from "@/components/Toast";
import { Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Filter = "all" | "pending" | "done";

export default function FarmerPayments() {
  const { user } = useAuth();
  const { t } = useI18n();
  const version = useStoreVersion();
  const [filter, setFilter] = useState<Filter>("all");
  const [toast, setToast] = useState<string | null>(null);

  const deals = useMemo(() => {
    if (!user) return [];
    return getDealsForFarmer(user.id);
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
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t("deal.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("deal.subtitle")}</p>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              filter === f.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            )}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      <Card className="gap-0 p-0">
        <CardContent className="px-4 sm:px-5">
          {shown.length === 0 ? (
            <div className="py-16 text-center">
              <span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Inbox size={24} aria-hidden />
              </span>
              <p className="text-sm text-muted-foreground">{t("deal.empty.farmer")}</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {shown.map((deal) => (
                <DealRow
                  key={deal.id}
                  deal={deal}
                  confirmableBy="farmer"
                  onConfirm={() => setToast(t("deal.confirmedMsg"))}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Toast message={toast} />
    </div>
  );
}