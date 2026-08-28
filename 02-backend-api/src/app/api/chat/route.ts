import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { DomainError } from "@/lib/errors";
import { badRequest, sendError, sendOk } from "@/lib/http";
import { buildChatReply } from "@/lib/services/chat";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(1000),
});

const chatSchema = z.object({
  messages: z.array(messageSchema).min(1).max(20),
});

/**
 * POST /api/chat - Wandaa AI in-app support assistant.
 * Stateless: client resends the running conversation each time. Advisory
 * only, same as /api/predictions - nothing here writes to a product, offer
 * or trade.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

  try {
    const { reply, model } = await buildChatReply(auth.user, parsed.data.messages);
    return sendOk({ reply, model });
  } catch (err) {
    if (err instanceof DomainError) return sendError(err.message, err.status);
    throw err;
  }
}
