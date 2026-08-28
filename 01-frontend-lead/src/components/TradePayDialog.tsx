"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { apiPaymentStatus, apiRequestPayment, type ApiPayment } from "@/lib/api";
import { refresh } from "@/lib/remote";
import { formatRwf } from "@/lib/format";
import type { Deal } from "@/lib/types";

/*
 * Buyer pays for an accepted trade over Lightning.
 *
 * The invoice is minted by the backend against the escrow node, so the amount
 * is the server's figure and cannot be edited here. Settlement is detected by
 * polling the backend, which asks LND - the UI never decides that a payment
 * happened.
 */
/** Seconds before the demo payer settles the invoice automatically. */
const INVOICE_WINDOW_SECONDS = 30;

export function TradePayDialog({
  deal,
  onClose,
  windowSeconds = INVOICE_WINDOW_SECONDS,
}: {
  deal: Deal;
  onClose: (paid: boolean) => void;
  windowSeconds?: number;
}) {
  const { t } = useI18n();
  const [payment, setPayment] = useState<ApiPayment | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState(0);
  const [autoPaying, setAutoPaying] = useState(false);
  const autoPaidRef = useRef(false);
  const pollRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);

  const stopPoll = () => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };
  useEffect(() => stopPoll, []);

  const makeQr = useCallback(async (text: string) => {
    try {
      const QRCode = (await import("qrcode")).default;
      setQr(await QRCode.toDataURL(text, { width: 240, margin: 1 }));
    } catch {
      setQr(null);
    }
  }, []);

  /*
   * Demo convenience: after the countdown, a stand-in buyer node settles the
   * invoice so a presentation needs no terminal. Real buyers pay from their
   * own wallet, and the backend still decides whether the trade advanced -
   * this only moves the sats.
   */
  const autoPay = useCallback(async (payReq: string) => {
    setAutoPaying(true);
    try {
      const res = await fetch("/api/lightning/demo-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payReq }),
      });
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) setError(body?.error ?? t("pay.autoFailed"));
    } catch {
      setError(t("pay.autoFailed"));
    } finally {
      setAutoPaying(false);
    }
  }, [t]);

  const start = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await apiRequestPayment(deal.id);
      setPayment(res.payment);
      await makeQr(res.payment.paymentRequest);

      stopPoll();

      /*
       * The countdown is a prompt, not a deadline: polling keeps running past
       * zero, so an invoice paid late is still detected. It only tells the
       * payer this one is getting stale and offers a fresh one.
       */
      setLeft(windowSeconds);
      autoPaidRef.current = false;
      tickRef.current = window.setInterval(() => {
        setLeft((n) => {
          if (n > 1) return n - 1;
          // Fire once: the interval keeps ticking at zero.
          if (!autoPaidRef.current) {
            autoPaidRef.current = true;
            void autoPay(res.payment.paymentRequest);
          }
          return 0;
        });
      }, 1000);

      pollRef.current = window.setInterval(async () => {
        try {
          const s = await apiPaymentStatus(res.payment.id);
          if (s.payment.status === "PAID") {
            stopPoll();
            setPaid(true);
            // Pull the trade's new state so the list behind the dialog updates.
            await refresh();
          } else if (s.payment.status === "FAILED") {
            stopPoll();
            setError(t("pay.failed"));
          }
        } catch {
          // Transient network trouble: keep polling rather than giving up.
        }
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("pay.error"));
    } finally {
      setBusy(false);
    }
  }, [deal.id, makeQr, t, windowSeconds]);

  const copy = async () => {
    if (!payment) return;
    try {
      await navigator.clipboard.writeText(payment.paymentRequest);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked; the invoice text is on screen regardless.
    }
  };

  return (
    <div style={S.backdrop} onClick={() => onClose(paid)}>
      <div style={S.sheet} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: 0, fontSize: 18 }}>{t("pay.title")}</h3>
        <p className="subtle" style={{ margin: "4px 0 14px" }}>
          {deal.productTitle} · {formatRwf(deal.amountRwf)}
        </p>

        {error && <div className="form-error">{error}</div>}

        {paid ? (
          <div style={S.paid}>
            <div style={{ fontSize: 40 }}>✅</div>
            <div style={{ fontWeight: 700, marginTop: 6 }}>{t("pay.paid")}</div>
            <p className="subtle" style={{ marginTop: 6 }}>
              {t("pay.paidNote")}
            </p>
            <button className="btn btn-primary btn-block" onClick={() => onClose(true)}>
              {t("pay.done")}
            </button>
          </div>
        ) : !payment ? (
          <>
            <p className="subtle">{t("pay.intro")}</p>
            <button className="btn btn-primary btn-block" onClick={start} disabled={busy}>
              {busy ? t("pay.creating") : t("pay.create")}
            </button>
            <button className="btn btn-ghost btn-block" onClick={() => onClose(false)}>
              {t("prod.cancel")}
            </button>
          </>
        ) : (
          <>
            {qr && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="Lightning invoice QR" style={S.qr} />
            )}
            <div style={S.invoice}>{payment.paymentRequest}</div>
            <div className="row" style={{ gap: 8, alignItems: "center" }}>
              <button className="btn btn-secondary btn-sm" onClick={copy}>
                {copied ? t("pay.copied") : t("pay.copy")}
              </button>
              {left > 0 && <span style={S.countdown}>{t("pay.autoIn")} {left}s</span>}
              <span className="subtle" style={{ fontSize: 12 }}>
                {autoPaying ? t("pay.autoPaying") : t("pay.waiting")}
              </span>
            </div>
            <button className="btn btn-ghost btn-block" onClick={() => onClose(false)}>
              {t("pay.later")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(21,36,28,.5)",
    display: "grid",
    placeItems: "center",
    zIndex: 70,
    padding: 16,
  },
  sheet: {
    background: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 380,
    maxHeight: "90vh",
    overflowY: "auto",
  },
  qr: { display: "block", margin: "0 auto 12px", width: 220, height: 220 },
  invoice: {
    fontFamily: "ui-monospace, monospace",
    fontSize: 10,
    wordBreak: "break-all",
    background: "#f1f5f9",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    maxHeight: 90,
    overflowY: "auto",
  },
  paid: { textAlign: "center" },
  countdown: {
    fontFamily: "ui-monospace, monospace",
    fontWeight: 700,
    color: "#166534",
    background: "#dcfce7",
    borderRadius: 999,
    padding: "4px 10px",
    fontSize: 12,
  },
};
