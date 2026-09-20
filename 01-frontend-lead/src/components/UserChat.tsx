"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useStoreVersion } from "@/lib/store-bus";
import {
  chatCounterpart,
  getChatMessages,
  getChatThread,
  getChatThreads,
  getProduct,
  markChatThreadRead,
  openChatThread,
  sendChatMessage,
} from "@/lib/store";
import { formatDate } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ArrowLeft, MessageCircle, Send, Store } from "lucide-react";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

/** Very small {key} interpolation for translation strings. */
function fmt(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");
}

export function UserChat() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const version = useStoreVersion();
  const router = useRouter();
  const params = useSearchParams();

  const [threadId, setThreadId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const resolvedRef = useRef(false);

  /*
   * Deep-link entry: /chat?with=<userId>&name=<...>&product=<productId>
   * opens (or creates) the conversation for that person and product. Handled
   * once, then the URL is cleaned up so navigation feels native.
   */
  useEffect(() => {
    if (!user || resolvedRef.current) return;
    resolvedRef.current = true;
    const initialThread = params.get("thread");
    if (initialThread) {
      setThreadId(initialThread);
      markChatThreadRead(initialThread, user.id);
      return;
    }
    const withId = params.get("with");
    if (!withId || withId === user.id) return;
    const productId = params.get("product");
    const product = productId ? getProduct(productId) : undefined;
    const thread = openChatThread({
      self: { id: user.id, name: user.name, role: user.role },
      counterpart: {
        id: withId,
        name: params.get("name") || product?.farmerName || "…",
        role: user.role === "farmer" ? "buyer" : "farmer",
      },
      productId: productId ?? undefined,
      productTitle: product?.title,
    });
    setThreadId(thread.id);
    markChatThreadRead(thread.id, user.id);
    router.replace("/chat", { scroll: false });
  }, [user, params, router]);

  const rows = useMemo(() => {
    if (!user) return [];
    return getChatThreads().map((thread) => {
      const msgs = getChatMessages(thread.id);
      const last = msgs[msgs.length - 1];
      return {
        thread,
        unread: msgs.filter(
          (m) => m.senderId !== user.id && !m.readBy.includes(user.id)
        ).length,
        preview: last
          ? last.kind === "system"
            ? t("chat.connected")
            : last.text
          : "",
        time: last?.createdAt ?? thread.updatedAt,
      };
    });
  }, [user, version, t]);

  const thread = threadId ? getChatThread(threadId) : null;
  const messages = useMemo(
    () => (threadId ? getChatMessages(threadId) : []),
    [threadId, version]
  );
  const counterpart = thread && user ? chatCounterpart(thread, user.id) : undefined;

  useEffect(() => {
    if (!user || !threadId) return;
    markChatThreadRead(threadId, user.id);
  }, [threadId, user, version]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  if (!user) return null;

  const openThread = (id: string) => {
    setThreadId(id);
    router.replace(`/chat?thread=${id}`, { scroll: false });
  };

  const send = () => {
    if (!threadId || !draft.trim()) return;
    sendChatMessage(threadId, { id: user.id, name: user.name }, draft);
    setDraft("");
  };

  const toMarketplace =
    user.role === "farmer" ? "/farmer/products" : "/buyer/marketplace";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t("nav.messages")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("chat.subtitle")}</p>
      </div>

      {rows.length === 0 && !thread ? (
        <div className="rounded-2xl border border-dashed bg-muted/40 px-4 py-16 text-center">
          <span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600">
            <MessageCircle size={24} aria-hidden />
          </span>
          <p className="font-semibold text-foreground">{t("chat.empty.title")}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {t("chat.empty.body")}
          </p>
          <Button asChild size="sm" className="mt-4 rounded-full px-5">
            <Link href={toMarketplace}>
              <Store size={15} aria-hidden />
              {t("chat.empty.action")}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          {/* Conversation list */}
          <div
            className={cn(
              "overflow-hidden rounded-2xl border border-border bg-card",
              thread ? "hidden lg:block" : "block"
            )}
          >
            {rows.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                {t("chat.empty.title")}
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {rows.map(({ thread: th, unread, preview, time }) => {
                  const withUser = chatCounterpart(th, user.id);
                  const on = th.id === threadId;
                  return (
                    <button
                      key={th.id}
                      onClick={() => openThread(th.id)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                        on ? "bg-primary/5" : "hover:bg-accent/60"
                      )}
                    >
                      <Avatar className="size-11 shrink-0 border border-border bg-emerald-500/10 text-emerald-700">
                        <AvatarFallback className="bg-transparent font-bold text-emerald-700">
                          {initials(withUser?.name ?? "")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-sm font-semibold">
                            {withUser?.name}
                          </span>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {formatDate(time, locale)}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              "truncate text-xs",
                              unread > 0
                                ? "font-semibold text-foreground"
                                : "text-muted-foreground"
                            )}
                          >
                            {preview || th.productTitle || t("chat.empty.thread")}
                          </span>
                          {unread > 0 && (
                            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                              {unread > 99 ? "99+" : unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Thread */}
          <div className={cn("rounded-2xl border border-border bg-card", thread ? "block" : "hidden lg:block")}>
            {thread && counterpart ? (
              <div className="flex h-[min(70vh,560px)] flex-col">
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 rounded-xl lg:hidden"
                    onClick={() => {
                      setThreadId(null);
                      router.replace("/chat", { scroll: false });
                    }}
                    title={t("chat.back")}
                    aria-label={t("chat.back")}
                  >
                    <ArrowLeft size={18} />
                  </Button>
                  <Avatar className="size-10 border border-border bg-emerald-500/10 text-emerald-700">
                    <AvatarFallback className="bg-transparent font-bold text-emerald-700">
                      {initials(counterpart.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 leading-tight">
                    <div className="truncate text-sm font-bold">
                      {counterpart.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {counterpart.role === "farmer" ? t("role.farmer") : t("role.buyer")}
                    </div>
                  </div>
                  {thread.productTitle && (
                    <span className="ml-auto hidden max-w-[40%] truncate rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 sm:block">
                      {t("chat.about")}: {thread.productTitle}
                    </span>
                  )}
                </div>

                {/* Messages */}
                <div
                  ref={listRef}
                  className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
                >
                  {messages.length === 0 && (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      {t("chat.empty.thread")}
                    </div>
                  )}
                  {messages.map((msg) => {
                    if (msg.kind === "system") {
                      return (
                        <div key={msg.id} className="flex justify-center">
                          <span className="rounded-full bg-muted px-3 py-1 text-center text-[11px] text-muted-foreground">
                            {fmt(t("chat.connected"), {
                              name: msg.meta?.name ?? "",
                              product: msg.meta?.productTitle ?? "",
                            })}
                          </span>
                        </div>
                      );
                    }
                    const mine = msg.senderId === user.id;
                    return (
                      <div
                        key={msg.id}
                        className={cn("flex flex-col", mine ? "items-end" : "items-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm sm:max-w-[70%]",
                            mine
                              ? "rounded-br-md bg-primary text-primary-foreground"
                              : "rounded-bl-md bg-muted text-foreground"
                          )}
                        >
                          {msg.text}
                        </div>
                        <span className="mt-1 px-1 text-[10px] text-muted-foreground">
                          {mine
                            ? t("chat.you")
                            : counterpart.name.split(/\s+/)[0] ?? ""}
                          {" · "}
                          {formatDate(msg.createdAt, locale)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Composer */}
                <div className="flex items-center gap-2 border-t border-border/70 px-3 py-3">
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder={t("chat.placeholder")}
                    className="h-11 rounded-xl"
                    aria-label={t("chat.placeholder")}
                  />
                  <Button
                    size="icon"
                    className="size-11 shrink-0 rounded-xl"
                    onClick={send}
                    disabled={!draft.trim()}
                    title={t("chat.send")}
                    aria-label={t("chat.send")}
                  >
                    <Send size={18} />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-16 text-center">
                <span className="mb-3 grid size-14 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                  <MessageCircle size={26} aria-hidden />
                </span>
                <p className="text-sm text-muted-foreground">{t("chat.empty.body")}</p>
                <Button asChild size="sm" className="mt-4 rounded-full px-5">
                  <Link href={toMarketplace}>
                    <Store size={15} aria-hidden />
                    {t("chat.empty.action")}
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}