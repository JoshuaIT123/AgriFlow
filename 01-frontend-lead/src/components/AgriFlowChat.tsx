"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { apiChat, ApiError, type ChatMessage } from "@/lib/api";
import { Loader, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function AgriFlowChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Muraho! I'm AgriFlowChat. Ask me anything about listing produce, offers, trades, or payments.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setError(null);
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setSending(true);
    try {
      const { reply } = await apiChat(next);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "AgriFlowChat is unavailable right now.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open AgriFlowChat support"
        className="fixed bottom-20 right-4 z-[60] grid size-13 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 lg:bottom-6 lg:right-6"
      >
        {open ? (
          <X size={20} />
        ) : (
          <span className="grid size-9 place-items-center rounded-full bg-white/15">
            <Sparkles size={18} />
          </span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-[6.5rem] right-4 z-[60] flex max-h-[min(32rem,70dvh)] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl lg:bottom-24 lg:right-6">
          {/* Branded header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#08301f] to-[#146b3d] px-4 py-3 text-white">
            <div className="absolute -right-6 -top-8 size-28 rounded-full bg-lime-300/15 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <Image
                src="/images/logo.png"
                alt="AgriFlow logo"
                width={36}
                height={36}
                className="size-9 rounded-xl object-cover shadow"
              />
              <div className="leading-tight">
                <div className="flex items-center gap-1.5 text-sm font-bold tracking-tight">
                  AgriFlow
                  <span className="rounded-full bg-lime-300/20 px-2 py-0.5 text-[11px] font-semibold text-lime-300">
                    Chat
                  </span>
                </div>
                <div className="text-[11px] text-white/70">
                  AI assistant · support
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3" ref={scrollRef}>
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                  m.role === "user"
                    ? "ml-auto rounded-br-sm bg-primary text-primary-foreground"
                    : "mr-auto rounded-bl-sm bg-muted text-foreground"
                )}
              >
                {m.content}
              </div>
            ))}
            {sending && (
              <div className="mr-auto flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2 text-sm text-muted-foreground">
                <Loader size={13} className="animate-spin" aria-hidden />
                ...
              </div>
            )}
          </div>

          {error && (
            <p className="px-4 pb-1 text-xs font-medium text-red-600">{error}</p>
          )}

          <div className="flex gap-2 border-t border-border/60 p-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask AgriFlowChat..."
              disabled={sending}
              className="h-10"
            />
            <Button
              size="icon"
              onClick={send}
              disabled={sending || !input.trim()}
              aria-label="Send message"
            >
              <Send size={15} aria-hidden />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}