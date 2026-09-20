"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useI18n } from "@/lib/i18n-context";
import { simulateWalletTopUp } from "@/lib/store";
import { bumpStore } from "@/lib/store-bus";
import { formatRwf } from "@/lib/format";
import {
  CheckCircle2,
  CircleAlert,
  Copy,
  ExternalLink,
  LoaderCircle,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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

export function LightningPay({
  accountId,
  role = "buyer",
}: {
  accountId: string;
  role?: "buyer" | "farmer";
}) {
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
  const roleLabel = role === "buyer" ? "Buyer (alice)" : "Farmer";

  return (
    <Card className="gap-0 p-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {t("ln.title")}
          <span
            className={cn(
              "grid size-5 place-items-center rounded-full",
              hasNode ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"
            )}
            title={hasNode ? t("ln.nodeOn") : t("ln.nodeOff")}
          >
            <Zap size={12} aria-hidden />
          </span>
        </CardTitle>
        <CardDescription>
          {status === null
            ? t("ln.creating")
            : hasNode && status?.node
              ? `${roleLabel} · ${t("ln.nodeAlias")}: ${status.node.alias || status.node.nodeName}${
                  status.node.balance != null
                    ? ` · ${t("ln.nodeBalance")}: ${status.node.balance} sats`
                    : ""
                }`
              : t("ln.subtitle")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {role === "buyer" && hasNode && (
          <p className="text-xs text-muted-foreground">
            Payment routes to escrow (alice), then settles out to the farmer on trade completion.
          </p>
        )}

        {!hasNode && status && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm font-medium text-amber-800">
            <TriangleAlert size={16} className="mt-0.5 shrink-0" />
            {t("ln.needNode")}
          </div>
        )}

        {hasNode && !invoice && (
          <form onSubmit={createInvoice} className="space-y-3">
            <div className="flex flex-wrap items-end gap-2.5">
              <div className="min-w-[140px] flex-1 space-y-1.5">
                <Label htmlFor="ln-sats">{t("ln.amount")}</Label>
                <Input
                  id="ln-sats"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={sats}
                  onChange={(e) => setSats(e.target.value)}
                  placeholder={t("ln.amount")}
                />
              </div>
              <div className="min-w-[110px] flex-1 space-y-1.5">
                <Label htmlFor="ln-rate" title={t("ln.rate")}>
                  {t("ln.rate")}
                </Label>
                <Input
                  id="ln-rate"
                  type="number"
                  inputMode="decimal"
                  min="0.0000001"
                  step="any"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder={t("ln.rate")}
                />
              </div>
              <Button type="submit" disabled={busy || !sats} className="h-11">
                {busy ? t("ln.creating") : t("ln.create")}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("ln.amountRwf")}:{" "}
              <span className="font-mono font-semibold">
                {formatRwf(rwfEq)}
              </span>{" "}
              · {t("ln.rateHint")}
            </p>
          </form>
        )}

        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            <CircleAlert size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {invoice && !settled && (
          <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/30 p-4">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              {qrDataUrl && (
                <div className="shrink-0 rounded-xl bg-white p-2 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt="Lightning invoice QR"
                    width={184}
                    height={184}
                  />
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-2.5">
                <div className="text-sm font-bold">{t("ln.scan")}</div>
                <div className="rounded-lg bg-muted/70 px-3 py-2 font-mono text-[11px] break-all">
                  {invoice.payReq}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={copyPayReq}>
                    <Copy size={13} aria-hidden />
                    {copied ? t("ln.copied") : t("ln.copy")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const url = `lightning:${invoice.payReq}`;
                      window.open(url, "_blank");
                    }}
                  >
                    <ExternalLink size={13} aria-hidden />
                    {t("ln.openWallet")}
                  </Button>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-bold text-amber-600">
                  <LoaderCircle size={14} className="animate-spin" aria-hidden />
                  {t("ln.waiting")}
                </div>
              </div>
            </div>
          </div>
        )}

        {settled && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm font-bold text-emerald-700">
            <CheckCircle2 size={16} aria-hidden />
            {t("ln.paid")} (+{formatRwf(rwfEq)})
          </div>
        )}
      </CardContent>
    </Card>
  );
}