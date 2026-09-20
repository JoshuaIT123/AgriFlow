"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { apiPaymentStatus, apiRequestPayment, type ApiPayment } from "@/lib/api";
import { refresh } from "@/lib/remote";
import { formatRwf } from "@/lib/format";
import type { Deal } from "@/lib/types";
import { CircleAlert, CheckCircle2, Copy, QrCode, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [cancelled, setCancelled] = useState(false);
  const autoPaidRef = useRef(false);
  const cancelledRef = useRef(false);
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
      cancelledRef.current = false;
      setCancelled(false);
      tickRef.current = window.setInterval(() => {
        setLeft((n) => {
          if (n > 1) return n - 1;
          // Fire once: the interval keeps ticking at zero.
          // Cancelling only stops the automatic payment; the invoice stays
          // valid, so the payer can still settle it from their own wallet.
          if (!autoPaidRef.current && !cancelledRef.current) {
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
    <Dialog open onOpenChange={(o) => !o && onClose(paid)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("pay.title")}</DialogTitle>
          <DialogDescription>
            {deal.productTitle} · {formatRwf(deal.amountRwf)}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            <CircleAlert size={17} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {paid ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 size={34} aria-hidden />
            </span>
            <div className="text-lg font-bold">{t("pay.paid")}</div>
            <p className="text-sm text-muted-foreground">{t("pay.paidNote")}</p>
            <Button className="mt-3 w-full" onClick={() => onClose(true)}>
              {t("pay.done")}
            </Button>
          </div>
        ) : !payment ? (
          <div className="flex flex-col gap-3 py-2">
            <p className="text-sm text-muted-foreground">{t("pay.intro")}</p>
            <Button onClick={start} disabled={busy} className="w-full">
              <Zap size={16} aria-hidden />
              {busy ? t("pay.creating") : t("pay.create")}
            </Button>
            <Button variant="ghost" onClick={() => onClose(false)}>
              {t("prod.cancel")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              {qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qr}
                  alt="Lightning invoice QR"
                  className="mx-auto block h-52 w-52 rounded-xl bg-white p-1 shadow-sm"
                />
              ) : (
                <div className="flex h-52 flex-col items-center justify-center gap-2 text-muted-foreground">
                  <QrCode size={28} aria-hidden />
                  <span className="text-xs">{t("pay.waiting")}</span>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/40 px-3 py-2.5 font-mono text-[11px] leading-relaxed break-all">
              {payment.paymentRequest}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" onClick={copy}>
                <Copy size={13} aria-hidden />
                {copied ? t("pay.copied") : t("pay.copy")}
              </Button>
              {left > 0 && !cancelled && (
                <>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 font-mono text-xs font-bold text-emerald-700">
                    {t("pay.autoIn")} {left}s
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      cancelledRef.current = true;
                      setCancelled(true);
                      setLeft(0);
                    }}
                  >
                    {t("pay.cancel")}
                  </Button>
                </>
              )}
              <span className="ml-auto text-xs text-muted-foreground">
                {autoPaying
                  ? t("pay.autoPaying")
                  : cancelled
                    ? t("pay.cancelled")
                    : t("pay.waiting")}
              </span>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => onClose(false)}>
                {t("pay.later")}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}