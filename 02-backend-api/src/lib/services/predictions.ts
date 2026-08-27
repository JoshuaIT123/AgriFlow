import { config } from "../config";
import { db } from "../db";
import { DomainError } from "../errors";
import type { Product, User } from "../types";

/**
 * Market predictions via the Hugging Face router.
 *
 * The model never sees the database: it is handed a compact, anonymised
 * summary of live listings and recent offers, and asked to return strict
 * JSON. Everything it produces is advisory - prices, quantities and trades
 * are still computed by the backend, so a bad completion cannot move money.
 */

export interface ProductForecast {
  productId: string;
  name: string;
  currentPrice: number;
  suggestedMin: number;
  suggestedMax: number;
  demand: "LOW" | "STEADY" | "HIGH";
  note: string;
}

export interface PredictionResult {
  generatedAt: string;
  model: string;
  summary: string;
  forecasts: ProductForecast[];
}

interface OfferStat {
  count: number;
  avg: number;
  best: number;
}

/** Offer pressure per product: how many bids, and at what prices. */
async function offerStats(products: Product[]): Promise<Map<string, OfferStat>> {
  const offers = await db.offers.listForProducts(products.map((p) => p.id));
  const stats = new Map<string, OfferStat>();
  for (const o of offers) {
    const s = stats.get(o.productId) ?? { count: 0, avg: 0, best: 0 };
    s.avg = (s.avg * s.count + o.price) / (s.count + 1);
    s.count += 1;
    s.best = Math.max(s.best, o.price);
    stats.set(o.productId, s);
  }
  return stats;
}

function buildPrompt(products: Product[], stats: Map<string, OfferStat>): string {
  const rows = products.map((p) => {
    const s = stats.get(p.id);
    return {
      productId: p.id,
      name: p.name,
      category: p.quality || "Other",
      location: p.location,
      unit: p.unit,
      askingPrice: p.price,
      availableQuantity: p.quantity,
      offers: s ? { count: s.count, averageOffer: Math.round(s.avg), bestOffer: s.best } : null,
    };
  });

  return [
    "You are an agricultural market analyst for Rwanda. All prices are RWF per unit.",
    "For each listing below, estimate a fair selling price range and demand level.",
    "Base demand on offer count and how offers compare to the asking price.",
    "",
    "Return ONLY valid JSON, no markdown fence, in exactly this shape:",
    '{"summary":"<one sentence on the overall market>","forecasts":[' +
      '{"productId":"<id>","suggestedMin":<number>,"suggestedMax":<number>,' +
      '"demand":"LOW|STEADY|HIGH","note":"<max 12 words>"}]}',
    "",
    "Listings:",
    JSON.stringify(rows),
  ].join("\n");
}

/** Pulls the JSON object out of a completion that may be fenced or prefixed. */
function parseModelJson(raw: string): { summary?: string; forecasts?: unknown[] } {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new DomainError(502, "Prediction model returned an unreadable response");
  }
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new DomainError(502, "Prediction model returned invalid JSON");
  }
}

function clampNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback;
}

function clampDemand(value: unknown): ProductForecast["demand"] {
  return value === "LOW" || value === "HIGH" ? value : "STEADY";
}

/**
 * Builds forecasts for the listings relevant to this user: a farmer's own
 * products, or the whole active market for a buyer.
 */
export async function buildPredictions(user: User): Promise<PredictionResult> {
  if (!config.hfToken) {
    throw new DomainError(503, "Predictions are not configured (HF_TOKEN is unset)");
  }

  const products =
    user.role === "FARMER"
      ? await db.products.listByFarmer(user.id)
      : await db.products.listActive();

  if (products.length === 0) {
    return {
      generatedAt: new Date().toISOString(),
      model: config.hfModel,
      summary: "No active listings to analyse yet.",
      forecasts: [],
    };
  }

  // Keep the prompt bounded: newest listings first, capped.
  const considered = products.slice(0, 20);
  const stats = await offerStats(considered);

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
        temperature: 0.2,
        max_tokens: 1200,
        messages: [{ role: "user", content: buildPrompt(considered, stats) }],
      }),
      // A slow model must not hold a serverless invocation open indefinitely.
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    throw new DomainError(504, "Prediction service did not respond in time");
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new DomainError(
      502,
      `Prediction service error (${res.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`,
    );
  }

  const payload = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new DomainError(502, "Prediction model returned an empty response");
  }

  const parsed = parseModelJson(content);
  const byId = new Map(considered.map((p) => [p.id, p]));

  const forecasts: ProductForecast[] = [];
  for (const entry of Array.isArray(parsed.forecasts) ? parsed.forecasts : []) {
    const f = entry as Record<string, unknown>;
    const product = byId.get(String(f.productId));
    if (!product) continue; // ignore ids the model invented
    const min = clampNumber(f.suggestedMin, product.price);
    const max = clampNumber(f.suggestedMax, product.price);
    forecasts.push({
      productId: product.id,
      name: product.name,
      currentPrice: product.price,
      suggestedMin: Math.min(min, max),
      suggestedMax: Math.max(min, max),
      demand: clampDemand(f.demand),
      note: String(f.note ?? "").slice(0, 120),
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    model: config.hfModel,
    summary: String(parsed.summary ?? "").slice(0, 300),
    forecasts,
  };
}
