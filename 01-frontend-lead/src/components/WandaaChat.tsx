"use client";

import { useEffect, useRef, useState } from "react";
import { apiChat, ApiError, type ChatMessage } from "@/lib/api";

export default function WandaaChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Muraho! I'm Wandaa AI. Ask me anything about listing produce, offers, trades, or payments.",
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
      setError(err instanceof ApiError ? err.message : "Wandaa AI is unavailable right now.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button className="wandaa-fab" onClick={() => setOpen((v) => !v)} aria-label="Open Wandaa AI support chat">
        {open ? "\u2715" : "\uD83D\uDCAC"}
      </button>

      {open && (
        <div className="wandaa-panel">
          <div className="wandaa-header">
            <span>Wandaa AI</span>
            <span className="subtle">Support</span>
          </div>

          <div className="wandaa-messages" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`wandaa-bubble wandaa-${m.role}`}>
                {m.content}
              </div>
            ))}
            {sending && <div className="wandaa-bubble wandaa-assistant">...</div>}
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="wandaa-input-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask Wandaa AI..."
              disabled={sending}
            />
            <button className="btn btn-primary btn-sm" onClick={send} disabled={sending || !input.trim()}>
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
