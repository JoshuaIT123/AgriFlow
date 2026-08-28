import { config } from "../config";
import { DomainError } from "../errors";
import type { User } from "../types";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 1000;

function systemPrompt(user: User): string {
  return [
    "You are Wandaa AI, the in-app support assistant for AgriFlow, a marketplace",
    "connecting Rwandan farmers directly to buyers, with payment on delivery via",
    "Mobile Money or Bitcoin Lightning, held in escrow until delivery is confirmed.",
    "",
    `You are talking to a ${user.role.toLowerCase()} named ${user.name}.`,
    "Help with: how to list produce, make/accept offers, track trades and escrow",
    "status, top up or withdraw a wallet, use Lightning payments, and general",
    "questions about how AgriFlow works. You cannot see live prices, listings,",
    "trades or balances - for those, point the user to the relevant screen in",
    "the app rather than guessing numbers.",
    "Keep replies short (2-4 sentences), practical, and in the language the",
    "user writes in (English or Kinyarwanda).",
  ].join("\n");
}

/** Sends the conversation to the HF router and returns Wandaa AI's reply. */
export async function buildChatReply(
  user: User,
  messages: ChatMessage[],
): Promise<{ reply: string; model: string }> {
  if (!config.hfToken) {
    throw new DomainError(503, "Chat is not configured (HF_TOKEN is unset)");
  }
  if (messages.length === 0) {
    throw new DomainError(400, "At least one message is required");
  }

  const trimmed = messages.slice(-MAX_MESSAGES).map((m) => ({
    role: m.role,
    content: m.content.slice(0, MAX_MESSAGE_LENGTH),
  }));

  let res: Response;
  try {
    res = await fetch(`${config.hfBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.hfToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.hfModel,
        temperature: 0.4,
        max_tokens: 400,
        messages: [{ role: "system", content: systemPrompt(user) }, ...trimmed],
      }),
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    throw new DomainError(504, "Wandaa AI did not respond in time");
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new DomainError(
      502,
      `Chat service error (${res.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`,
    );
  }

  const payload = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new DomainError(502, "Wandaa AI returned an empty response");
  }

  return { reply: content.trim(), model: config.hfModel };
}
