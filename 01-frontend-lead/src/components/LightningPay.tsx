"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useI18n } from "@/lib/i18n-context";
import { simulateWalletTopUp } from "@/lib/store";
import { bumpStore } from "@/lib/store-bus";
import { formatRwf } from "@/lib/format";

interface LnStatus {
  available: boolean;
  node?: { alias?: string; pubkey?: string; channels?: number; networkName?: string; nodeName?: string; balance?: number | null };
  error?: string;
}

interface LnInvoice {
  rHash: string;
  payReq: string;
  expirySecs: number;
}

export function LightningPay({ accountId }: { accountId: string }) {
  const { t } = useI18n();
  const [status, setStatus] = useState<LnStatus | null>(null);
  const [sats, setSats] = useState("");
  const [rate, setRate] = useState("1");
  const [busy, setBusy] = useState(false);
  const [invoice, setInvoice] = useState<LnInvoice | null>(null);
  const [settled, setSettled] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  const rwfEq = Math.round((Number(sats) || 0) * (Number(rate) || 0));

  const generateQr = useCallback(async (text: string) => {
    try {
      const QRCode = (await import("qrcode")).default;
      const url = await QRCode.toDataURL(text, {
        width: 220,
        margin: 1,
        errorCorrectionLevel: "M",
      });
      setQrDataUrl(url);
    } catch {
      setQrDataUrl(null);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/lightning");
        const json = (await res.json()) as LnStatus;
        if (active) setStatus(json);
      } catch {
        if (active) setStatus({ available: false, error: "network error" });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const stopPoll = () => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };
  useEffect(() => stopPoll, []);

  const pollSettled = useCallback(
    (rHash: string) => {
      stopPoll();
      pollRef.current = window.setInterval(async () => {
        try {
          const res = await fetch(`/api/lightning/${rHash}`);
          const json = (await res.json()) as { settled?: boolean };
          if (json.settled) {
            stopPoll();
            setSettled(true);
            simulateWalletTopUp(accountId, Math.max(1, rwfEq));
            bumpStore();
          }
        } catch {
          /* keep polling */
        }
      }, 2000);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accountId]
  );

  const createInvoice = async (e: FormEvent) => {
    e.preventDefault();
    const amount = Math.round(Number(sats));
    if (!amount || amount <= 0) return;
    setError(null);
    setInvoice(null);
    setSettled(false);
    setCopied(false);
    setQrDataUrl(null);
    setBusy(true);
    try {
      const res = await fetch("/api/lightning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, memo: `AgriFlow top-up for ${accountId}` }),
      });
      const json = (await res.json()) as LnInvoice & { error?: string };
      if (!res.ok || !json.payReq) {
        setError(json.error || t("ln.failed"));
        return;
      }
      setInvoice(json);
      generateQr(json.payReq);
      pollSettled(json.rHash);
    } catch {
      setError(t("ln.failed"));
    } finally {
      setBusy(false);
    }
  };

  const copyPayReq = async () => {
    if (!invoice) return;
    try {
      await navigator.clipboard.writeText(invoice.payReq);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const hasNode = status?.available || false;

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>
        {t("ln.title")}
        <span
          className="ln-dot"
          style={{
            color: hasNode ? "var(--green)" : "var(--danger)",
            fontSize: 13,
            marginLeft: 10,
          }}
          title={hasNode ? t("ln.nodeOn") : t("ln.nodeOff")}
        >
          ●
        </span>
      </h3>
      <p className="subtle" style={{ margin: "0 0 12px" }}>
        {status === null
          ? t("ln.creating")
          : hasNode && status?.node
            ? `${t("ln.nodeAlias")}: ${status.node.alias || status.node.nodeName}${
                status.node.balance != null
                  ? ` · ${t("ln.nodeBalance")}: ${status.node.balance} sats`
                  : ""
              }`
            : t("ln.subtitle")}
      </p>

      {!hasNode && status && (
        <div className="ln-off" style={{ color: "var(--danger)", fontSize: 13 }}>
          ⚠ {t("ln.needNode")}
        </div>
      )}

      {hasNode && !invoice && (
        <form onSubmit={createInvoice} className="row" style={{ gap: 8, alignItems: "start", flexWrap: "wrap" }}>
          <div className="field" style={{ flex: "1 1 160px", marginBottom: 0 }}>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              value={sats}
              onChange={(e) => setSats(e.target.value)}
              placeholder={t("ln.amount")}
            />
          </div>
          <div className="field" style={{ flex: "1 1 120px", marginBottom: 0 }}>
            <input
              type="number"
              inputMode="numeric"
              min="0.0000001"
              step="any"
              value={rate}
              title={t("ln.rate")}
              onChange={(e) => setRate(e.target.value)}
              placeholder={t("ln.rate")}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy || !sats}>
            {busy ? t("ln.creating") : t("ln.create")}
          </button>
        </form>
      )}

      {hasNode && !invoice && (
        <div style={{ fontSize: 12, marginTop: 8, color: "#888" }}>
          {t("ln.amountRwf")}: <strong className="mono">{formatRwf(rwfEq)}</strong> · {t("ln.rateHint")}
        </div>
      )}

      {error && (
        <div className="ln-off" style={{ color: "var(--danger)", fontSize: 13, marginTop: 8 }}>
          ⚠ {error}
        </div>
      )}

      {invoice && !settled && (
        <div className="ln-invoice" style={{ marginTop: 14 }}>
          <div className="row" style={{ gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
            {qrDataUrl && (
              <div
                className="ln-qr"
                style={{ background: "#fff", padding: 10, borderRadius: 8, display: "inline-block" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="Lightning invoice QR" width={220} height={220} />
              </div>
            )}
            <div style={{ flex: "1 1 260px", minWidth: 240 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{t("ln.scan")}</div>
              <div className="ln-bolt11" style={{ margin: "10px 0", wordBreak: "break-all" }}>
                <code className="mono" style={{ fontSize: 12 }}>
                  {invoice.payReq}
                </code>
              </div>
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                <button className="btn btn-sm" onClick={copyPayReq}>
                  {copied ? t("ln.copied") : t("ln.copy")}
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    const url = `lightning:${invoice.payReq}`;
                    window.open(url, "_blank");
                  }}
                >
                  {t("ln.openWallet")}
                </button>
              </div>
              <div className="ln-waiting" style={{ marginTop: 14, color: "var(--warning)", fontWeight: 700 }}>
                ⏳ {t("ln.waiting")}
              </div>
            </div>
          </div>
        </div>
      )}

      {settled && (
        <div style={{ marginTop: 14, color: "var(--green)", fontWeight: 700 }}>
          ✅ {t("ln.paid")} (+{formatRwf(rwfEq)})
        </div>
      )}
    </div>
  );
}
