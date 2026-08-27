"use client";

import { useCallback, useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { apiPredictions, type Predictions } from "@/lib/api";
import { formatRwf } from "@/lib/format";

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

  const demandClass = (d: string) =>
    d === "HIGH" ? "badge-ok" : d === "LOW" ? "badge-pending" : "badge-neutral";

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="section-head" style={{ marginTop: 0 }}>
        <div>
          <h3 style={{ fontSize: 16, margin: 0 }}>{t("predict.title")}</h3>
          <p className="subtle" style={{ margin: "4px 0 0" }}>
            {t("predict.subtitle")}
          </p>
        </div>
        <button className="btn btn-sm btn-secondary" onClick={load} disabled={busy}>
          {busy ? t("predict.loading") : t("predict.run")}
        </button>
      </div>

      {error && <div className="form-error">{error}</div>}

      {data && (
        <>
          {data.summary && (
            <p className="subtle" style={{ marginTop: 4 }}>
              {data.summary}
            </p>
          )}

          {data.forecasts.length === 0 ? (
            <div className="empty">{t("predict.empty")}</div>
          ) : (
            data.forecasts.map((f) => (
              <div className="tx-row" key={f.productId}>
                <div className="tx-icon">📈</div>
                <div className="tx-main">
                  <div className="tx-title">{f.name}</div>
                  <div className="tx-sub">{f.note}</div>
                  <div style={{ marginTop: 6 }}>
                    <span className={`badge ${demandClass(f.demand)}`}>
                      {t(`predict.demand.${f.demand.toLowerCase()}`)}
                    </span>
                  </div>
                </div>
                <div className="tx-side">
                  <div className="tx-amount mono">
                    {formatRwf(f.suggestedMin)} – {formatRwf(f.suggestedMax)}
                  </div>
                  <div className="tx-sub" style={{ marginTop: 4 }}>
                    {t("predict.now")} {formatRwf(f.currentPrice)}
                  </div>
                </div>
              </div>
            ))
          )}

          <p className="subtle" style={{ marginTop: 10, fontSize: 12 }}>
            {t("predict.disclaimer")}
          </p>
        </>
      )}
    </div>
  );
}
