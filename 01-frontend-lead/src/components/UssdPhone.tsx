"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import {
  expectsFreeText,
  resolveScreen,
  USSD_CODE,
  type UssdState,
} from "@/lib/ussd";
import type { Locale } from "@/lib/types";

/*
 * Feature-phone USSD simulator for live demos.
 *
 * Most Rwandan smallholders reach services on a feature phone over USSD, not
 * a smartphone app, so the pitch needs to show that entry point. The keypad
 * is clickable for stage use and mirrored to the physical keyboard so a
 * presenter can drive it without hunting for buttons.
 */

type Phase = "dial" | "session";

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["*", "0", "#"],
];

export function UssdPhone() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("dial");
  const [dial, setDial] = useState("");
  const [input, setInput] = useState("");
  const [state, setState] = useState<UssdState>({ path: [], locale: null });

  const screen = useMemo(() => resolveScreen(state), [state]);
  const freeText = expectsFreeText(state);
  const ended = phase === "session" && screen.kind === "END";

  const reset = useCallback(() => {
    setPhase("dial");
    setDial("");
    setInput("");
    setState({ path: [], locale: null });
  }, []);

  const call = useCallback(() => {
    if (dial.replace(/\s/g, "") !== USSD_CODE) return;
    setPhase("session");
    setInput("");
  }, [dial]);

  const send = useCallback(() => {
    const value = input.trim();
    if (!value) return;
    setInput("");

    // First reply picks the language; it is not part of the menu path.
    if (state.locale === null) {
      const locale: Locale | null =
        value === "1" ? "en" : value === "2" ? "rw" : null;
      if (locale) setState({ path: [], locale });
      return;
    }

    // 0 goes back one level, matching how real menus behave.
    if (value === "0" && !freeText) {
      setState((s) => ({ ...s, path: s.path.slice(0, -1) }));
      return;
    }

    setState((s) => ({ ...s, path: [...s.path, value] }));
  }, [input, state.locale, freeText]);

  const press = useCallback(
    (key: string) => {
      if (phase === "dial") setDial((d) => (d.length < 12 ? d + key : d));
      else setInput((i) => (i.length < 16 ? i + key : i));
    },
    [phase],
  );

  const backspace = useCallback(() => {
    if (phase === "dial") setDial((d) => d.slice(0, -1));
    else setInput((i) => i.slice(0, -1));
  }, [phase]);

  // Keyboard mirroring: a presenter can type instead of clicking.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9*#]$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") backspace();
      else if (e.key === "Enter") phase === "dial" ? call() : send();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press, backspace, call, send, phase]);

  const dialReady = dial.replace(/\s/g, "") === USSD_CODE;

  return (
    <div style={S.wrap}>
      <div style={S.phone}>
        <div style={S.speaker} />

        <div style={S.screen}>
          <div style={S.statusBar}>
            <span>MTN RW</span>
            <span>▮▮▮ 2G</span>
          </div>

          {phase === "dial" ? (
            <div style={S.lcd}>
              <div style={S.lcdTitle}>Dial USSD</div>
              <div style={S.dialText}>{dial || <span style={S.hint}>{USSD_CODE}</span>}</div>
              <div style={S.lcdBody}>
                {dialReady ? "Press CALL" : `Type ${USSD_CODE}`}
              </div>
            </div>
          ) : (
            <div style={S.lcd}>
              <div style={S.lcdTitle}>{screen.title}</div>
              <div style={S.lcdBody}>
                {screen.body.map((line, i) => (
                  <div key={i}>{line || " "}</div>
                ))}
              </div>
              {!ended && (
                <div style={S.replyRow}>
                  <span style={S.replyLabel}>{freeText ? "Input:" : "Reply:"}</span>
                  <span style={S.replyValue}>{input}<span style={S.caret}>_</span></span>
                </div>
              )}
              {ended && <div style={S.ended}>— session ended —</div>}
            </div>
          )}
        </div>

        <div style={S.keypad}>
          {KEYS.map((row, ri) => (
            <div key={ri} style={S.keyRow}>
              {row.map((k) => (
                <button key={k} style={S.key} onClick={() => press(k)} aria-label={`Key ${k}`}>
                  {k}
                </button>
              ))}
            </div>
          ))}

          <div style={S.keyRow}>
            {phase === "dial" ? (
              <button
                style={{ ...S.action, ...S.call, ...(dialReady ? {} : S.disabled) }}
                onClick={call}
                disabled={!dialReady}
              >
                CALL
              </button>
            ) : ended ? (
              <button style={{ ...S.action, ...S.call }} onClick={reset}>
                RESTART
              </button>
            ) : (
              <button style={{ ...S.action, ...S.call }} onClick={send}>
                SEND
              </button>
            )}
            <button style={{ ...S.action, ...S.clear }} onClick={backspace}>
              DEL
            </button>
            <button style={{ ...S.action, ...S.end }} onClick={reset}>
              END
            </button>
          </div>
        </div>
      </div>

      <div style={S.side}>
        <h2 style={{ margin: 0, fontSize: 18 }}>USSD — no smartphone needed</h2>
        <p className="subtle" style={{ marginTop: 6 }}>
          Most smallholders in Rwanda reach services on a feature phone. Dial{" "}
          <strong>{USSD_CODE}</strong>, pick a language, and list produce, check
          prices or accept an offer — the same marketplace, over 2G.
        </p>
        <ol className="subtle" style={{ paddingLeft: 18, lineHeight: 1.9 }}>
          <li>Type <strong>{USSD_CODE}</strong> and press CALL</li>
          <li>Choose <strong>1</strong> English or <strong>2</strong> Kinyarwanda</li>
          <li>Try <strong>1</strong> sell, <strong>2</strong> prices, <strong>3</strong> offers</li>
          <li><strong>0</strong> goes back, <strong>5</strong> opens the app</li>
        </ol>
        {screen.handoff && (
          <button
            className="btn btn-primary btn-block"
            onClick={() => router.push("/register")}
          >
            Continue to AgriFlow
            <ArrowRight size={14} aria-hidden style={{ verticalAlign: "-2px", marginLeft: 4 }} />
          </button>
        )}
        <p className="subtle" style={{ fontSize: 12, marginTop: 12 }}>
          Simulation for demonstration. The keypad also responds to your
          keyboard.
        </p>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 28,
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "8px 0 32px",
  },
  phone: {
    width: 300,
    background: "linear-gradient(180deg,#1f2937,#111827)",
    borderRadius: 28,
    padding: 16,
    boxShadow: "0 18px 40px rgba(0,0,0,.35)",
    border: "1px solid #374151",
    flexShrink: 0,
  },
  speaker: {
    width: 56,
    height: 5,
    borderRadius: 3,
    background: "#374151",
    margin: "2px auto 12px",
  },
  screen: {
    background: "#0f172a",
    borderRadius: 12,
    border: "1px solid #334155",
    padding: 10,
    marginBottom: 14,
  },
  statusBar: {
    display: "flex",
    justifyContent: "space-between",
    color: "#64748b",
    fontFamily: "ui-monospace, monospace",
    fontSize: 10,
    marginBottom: 8,
  },
  lcd: {
    background: "#0b1220",
    border: "1px solid #1e293b",
    borderRadius: 8,
    padding: 12,
    minHeight: 190,
    fontFamily: "ui-monospace, monospace",
    color: "#86efac",
    fontSize: 13,
    lineHeight: 1.55,
  },
  lcdTitle: { color: "#fde68a", fontWeight: 700, marginBottom: 8 },
  lcdBody: { whiteSpace: "pre-wrap" },
  dialText: { fontSize: 22, letterSpacing: 2, margin: "18px 0" },
  hint: { color: "#334155" },
  replyRow: { marginTop: 12, display: "flex", gap: 6, color: "#e2e8f0" },
  replyLabel: { color: "#64748b" },
  replyValue: { color: "#fff" },
  caret: { opacity: 0.7 },
  ended: { marginTop: 12, color: "#64748b" },
  keypad: { display: "grid", gap: 8 },
  keyRow: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 },
  key: {
    background: "#1f2937",
    color: "#e5e7eb",
    border: "1px solid #374151",
    borderRadius: 10,
    padding: "12px 0",
    fontSize: 17,
    fontFamily: "ui-monospace, monospace",
    cursor: "pointer",
  },
  action: {
    border: "none",
    borderRadius: 10,
    padding: "12px 0",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.6,
    cursor: "pointer",
    color: "#fff",
  },
  call: { background: "#16a34a" },
  clear: { background: "#475569" },
  end: { background: "#b91c1c" },
  disabled: { opacity: 0.45, cursor: "not-allowed" },
  side: { maxWidth: 360, minWidth: 260, flex: 1 },
};
