"use client";

import { useCallback, useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { apiPredictions, type Predictions } from "@/lib/api";
import { formatRwf } from "@/lib/format";
import { Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * AI market outlook.
 *
 * Fetched on demand rather than on mount: the model call takes seconds and
 * costs a request, so a dashboard should not fire one every time it renders.
 */
export function PredictionPanel() {
  const { t } = useI18n();
  const [data, setData] = useState<Predictions | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await apiPredictions();
      setData(res.predictions);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("predict.error"));
    } finally {
      setBusy(false);
    }
  }, [t]);

  const demandBadge = (d: string) =>
    d === "HIGH"
      ? "bg-emerald-500/10 text-emerald-700"
      : d === "LOW"
        ? "bg-amber-500/10 text-amber-700"
        : "bg-muted text-muted-foreground";

  return (
    <Card className="gap-0 p-0">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles size={16} className="text-primary" aria-hidden />
            {t("predict.title")}
          </CardTitle>
          <CardDescription className="mt-1">
            {t("predict.subtitle")}
          </CardDescription>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={load}
          disabled={busy}
          className="ml-4 shrink-0"
        >
          {busy ? t("predict.loading") : t("predict.run")}
        </Button>
      </CardHeader>

      <CardContent className="pt-0">
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {data && (
          <div className="mt-3 space-y-4">
            {data.summary && (
              <p className="rounded-xl bg-primary/5 px-4 py-3 text-sm text-foreground/80">
                {data.summary}
              </p>
            )}

            {data.forecasts.length === 0 ? (
              <p className="rounded-xl bg-accent/60 px-4 py-6 text-center text-sm text-muted-foreground">
                {t("predict.empty")}
              </p>
            ) : (
              <div className="divide-y divide-border/60">
                {data.forecasts.map((f) => (
                  <div
                    key={f.productId}
                    className="flex flex-wrap items-center gap-3 py-3"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <TrendingUp size={18} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{f.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {f.note}
                      </div>
                      <span
                        className={cn(
                          "mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                          demandBadge(f.demand)
                        )}
                      >
                        {t(`predict.demand.${f.demand.toLowerCase()}`)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-bold">
                        {formatRwf(f.suggestedMin)} – {formatRwf(f.suggestedMax)}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {t("predict.now")} {formatRwf(f.currentPrice)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {t("predict.disclaimer")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}