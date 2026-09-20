"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";
import { useStoreVersion } from "@/lib/store-bus";
import {
  adminActivity,
  adminConversations,
  adminKpis,
  categoryBreakdown,
} from "@/lib/admin";
import { formatDate, formatRwf } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Handshake,
  LockKeyhole,
  MessageCircle,
  Package,
  Users,
  Wheat,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboard() {
  const { t, locale } = useI18n();
  const displayLocale = locale === "rw" ? "en" : locale;
  const version = useStoreVersion();

  const kpis = useMemo(() => adminKpis(), [version]);
  const categories = useMemo(() => categoryBreakdown(), [version]);
  const activity = useMemo(() => adminActivity(), [version]);
  const conversations = useMemo(() => adminConversations(), [version]);

  const maxCategory = Math.max(1, ...categories.map((c) => c.count));

  const cards = [
    {
      icon: Users,
      value: String(kpis.users),
      label: t("admin.kpi.users"),
      sub: `${kpis.farmers} ${t("admin.kpi.farmers")} · ${kpis.buyers} ${t("admin.kpi.buyers")}`,
    },
    {
      icon: Wheat,
      value: String(kpis.liveProducts),
      label: t("admin.kpi.products"),
      sub: `${kpis.liveProducts} live`,
    },
    {
      icon: Handshake,
      value: String(kpis.pendingOffers),
      label: t("admin.kpi.pendingOffers"),
      sub: `${kpis.pendingOffers} to respond`,
    },
    {
      icon: LockKeyhole,
      value: String(kpis.activeTrades),
      label: t("admin.kpi.activeTrades"),
      sub: formatRwf(kpis.escrowHeld),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t("admin.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("admin.subtitle")}</p>
        <p className="mt-3 rounded-xl bg-primary/5 px-4 py-2.5 text-xs text-muted-foreground">
          ⚡ {t("admin.api.note")}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="gap-0 p-0">
              <CardContent className="flex items-center gap-3.5 p-4 sm:p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon size={20} aria-hidden />
                </span>
                <div className="min-w-0">
                  <div className="font-mono text-2xl font-bold leading-none tracking-tight">
                    {s.value}
                  </div>
                  <div className="mt-1 truncate text-xs font-medium text-muted-foreground">
                    {s.label}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground/80">
                    {s.sub}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Money hero */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#0a0f1d] via-[#123047] to-[#14532d] text-white shadow-lg">
        <CardContent className="grid gap-6 p-6 sm:grid-cols-3 sm:p-7">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-white/60">
              {t("deal.status.released")}
            </div>
            <div className="mt-1 font-mono text-2xl font-bold tracking-tight sm:text-3xl">
              {formatRwf(kpis.releasedVolume)}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-white/60">
              {t("admin.kpi.escrow")}
            </div>
            <div className="mt-1 font-mono text-2xl font-bold tracking-tight sm:text-3xl">
              {formatRwf(kpis.escrowHeld)}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-white/60">
              {t("admin.volume.title")}
            </div>
            <div className="mt-1 font-mono text-2xl font-bold tracking-tight text-lime-300 sm:text-3xl">
              {formatRwf(kpis.volumeTotal)}
            </div>
            <div className="mt-1 text-[11px] text-white/60">
              {t("admin.volume.hint")}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Categories */}
        <Card className="gap-0 p-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("admin.categories.title")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            {categories.length === 0 ? (
              <div className="rounded-xl bg-accent/60 px-4 py-6 text-center text-sm text-muted-foreground">
                {t("admin.categories.empty")}
              </div>
            ) : (
              <div className="space-y-3">
                {categories.map((c) => (
                  <div key={c.category}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium capitalize">{c.category}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {c.count}
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(c.count / maxCategory) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="gap-0 p-0">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">{t("admin.recent.title")}</CardTitle>
            <Link
              href="/admin/trades"
              className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              {t("admin.nav.trades")}
              <ArrowRight size={14} aria-hidden />
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {activity.length === 0 ? (
              <div className="rounded-xl bg-accent/60 px-4 py-6 text-center text-sm text-muted-foreground">
                {t("admin.recent.empty")}
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {activity.map((a) => {
                  const Icon =
                    a.kind === "deal"
                      ? Package
                      : a.kind === "offer"
                        ? Handshake
                        : Wheat;
                  const tone =
                    a.kind === "deal"
                      ? "bg-primary/10 text-primary"
                      : a.kind === "offer"
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-emerald-500/10 text-emerald-600";
                  return (
                    <div key={a.id} className="flex items-center gap-3 py-2.5">
                      <span
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-xl",
                          tone
                        )}
                      >
                        <Icon size={16} aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">
                          {a.title}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {a.subtitle}
                        </div>
                      </div>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {formatDate(a.at, displayLocale)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversations */}
      <Card className="gap-0 p-0">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">{t("admin.chat.title")}</CardTitle>
          <span className="text-sm text-muted-foreground">
            {kpis.chatThreads} · {kpis.chatMessages} {t("admin.kpi.messages")}
          </span>
        </CardHeader>
        <CardContent className="pt-0">
          {conversations.length === 0 ? (
            <div className="rounded-xl bg-accent/60 px-4 py-6 text-center text-sm text-muted-foreground">
              {t("admin.chat.empty")}
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {conversations.slice(0, 4).map((c) => (
                <div key={c.threadId} className="flex items-center gap-3 py-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <MessageCircle size={18} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">
                      {c.participantNames.join(" ↔ ")}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {c.productTitle && `${c.productTitle} · `}
                      {c.lastMessage ?? t("chat.empty.thread")} · {c.messages}{" "}
                      {t("admin.kpi.messages")}
                    </div>
                  </div>
                  {c.lastAt && (
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatDate(c.lastAt, displayLocale)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}