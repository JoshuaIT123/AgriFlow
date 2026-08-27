/*
 * LND REST client + Polar auto-detection.
 *
 * A TypeScript port of the Day-4 "Lightning Webstore" approach
 * (lnd_client.py + polar_detect.py): talk to a local Polar LND node over its
 * REST API using the admin macaroon (hex) and its self-signed TLS cert.
 *
 * The heavy lifting lives here so the user-facing interface stays simple:
 * create an invoice -> show QR/BOLT11 -> poll until it's settled.
 * In production this service layer would run on a real backend.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import https from "node:https";

export interface LndConfig {
  lndDir: string;
  restHost: string;
  nodeName: string;
  networkName?: string;
}

export interface Invoice {
  rHash: string; // hex
  payReq: string; // BOLT11 payment_request
  expirySecs: number;
}

const POLAR_NETWORKS_FILE = path.join(
  os.homedir(),
  ".polar",
  "networks",
  "networks.json"
);

/** Parse Polar networks.json and find an LND node (prefer `preferName`). */
export function findPolarNode(preferName = "alice"): LndConfig | null {
  if (!fs.existsSync(POLAR_NETWORKS_FILE)) return null;
  let data: { networks?: unknown[] };
  try {
    data = JSON.parse(fs.readFileSync(POLAR_NETWORKS_FILE, "utf8"));
  } catch {
    return null;
  }
  const networks = (data?.networks || []) as Array<{
    status?: unknown;
    id?: unknown;
    name?: string;
    path?: string;
    nodes?: { lightning?: unknown[] };
  }>;

  // Polar writes status as a number (1 = Started); older builds used a string.
const isStarted = (s: unknown) => Number(s) === 1 || String(s).toUpperCase() === "STARTED";

  const sortKey = (n: { status?: unknown; id?: unknown }) => {
    const running = isStarted(n.status) ? 1 : 0;
    return running * 1_000_000_000 + (Number(n.id) || 0);
  };
  const sorted = [...networks].sort((a, b) => sortKey(b) - sortKey(a));

  for (const net of sorted) {
    const lndNodes = (net.nodes?.lightning || []) as Array<{
      implementation?: string;
      name?: string;
      status?: unknown;
      ports?: { rest?: number };
    }>;
    // Prefer an exact-name LND node, else the highest-status LND node.
    const exact = lndNodes.find(
      (n) =>
        String(n.implementation).toUpperCase() === "LND" &&
        String(n.name).toLowerCase() === preferName.toLowerCase()
    );
    const anyLnd = lndNodes.find(
      (n) => String(n.implementation).toUpperCase() === "LND"
    );
    const node = exact || anyLnd;
    if (!node) continue;

    const netPath =
      net.path || path.join(os.homedir(), ".polar", "networks", String(net.id));
    const lndDir = path.join(netPath, "volumes", "lnd", node.name || "");
    const restPort = node.ports?.rest ?? 8082;
    return {
      lndDir,
      restHost: `https://127.0.0.1:${restPort}`,
      nodeName: node.name || preferName,
      networkName: net.name,
    };
  }
  return null;
}

/** Resolve LND config: env override first, then Polar auto-detect. */
export function resolveConfig(preferName = "alice"): LndConfig {
  const envDir = process.env.LND_DIR;
  const envHost = process.env.REST_HOST;
  if (envDir && envHost) {
    return { lndDir: envDir, restHost: envHost, nodeName: preferName };
  }
  return (
    findPolarNode(preferName) ?? {
      lndDir: path.join(os.homedir(), "bootcamp-code", "alice"),
      restHost: "https://127.0.0.1:8084",
      nodeName: preferName,
    }
  );
}

export class LndClient {
  private macaroonHex = "";

  constructor(private config: LndConfig) {
    try {
      const macPath = path.join(
        config.lndDir,
        "data",
        "chain",
        "bitcoin",
        "regtest",
        "admin.macaroon"
      );
      this.macaroonHex = fs.readFileSync(macPath).toString("hex");
    } catch {
      this.macaroonHex = "";
    }
  }

  get connected(): boolean {
    return this.macaroonHex.length > 0;
  }

  private async req<T>(method: string, endpoint: string, body?: unknown): Promise<T> {
    if (!this.macaroonHex) {
      throw new Error(
        `LND not found at ${this.config.lndDir}. Make sure a Polar LND node is running.`
      );
    }
    const headers: Record<string, string> = {
      "Grpc-Metadata-macaroon": this.macaroonHex,
    };
    let payload: string | undefined;
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
    return this.rawReq(method, endpoint, headers, payload);
  }

  /**
   * Perform an LND REST call over Node's http(s) with TLS verification
   * disabled (LND uses a self-signed cert). Built-in fetch/undici can't
   * bypass self-signed TLS, so we use https.request directly.
   */
  private rawReq<T>(
    method: string,
    endpoint: string,
    headers: Record<string, string>,
    payload?: string
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const url = new URL(`${this.config.restHost}${endpoint}`);
      const req = https.request(
        {
          hostname: url.hostname,
          port: url.port || 443,
          path: url.pathname + url.search,
          method,
          headers,
          rejectUnauthorized: false,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => {
            const text = Buffer.concat(chunks).toString("utf8");
            if (res.statusCode && res.statusCode >= 400) {
              reject(new Error(`LND ${method} ${endpoint} -> ${res.statusCode} ${text}`));
              return;
            }
            try {
              resolve(JSON.parse(text) as T);
            } catch {
              resolve(text as unknown as T);
            }
          });
        }
      );
      req.on("error", (err) => reject(err));
      if (payload !== undefined) req.write(payload);
      req.end();
    });
  }

  async getInfo(): Promise<{
    alias?: string;
    identity_pubkey?: string;
    num_active_channels?: number;
    synced_to_chain?: boolean;
  }> {
    return this.req("GET", "/v1/getinfo");
  }

  async channelBalance(): Promise<{
    balance?: string | number;
    pending_open_balance?: string | number;
    local_balance?: string | number;
  }> {
    return this.req("GET", "/v1/balance/channels");
  }

  async addInvoice(amount: number, memo = ""): Promise<{
    r_hash: string;
    payment_request: string;
    expiry?: string | number;
  }> {
    return this.req("POST", "/v1/invoices", {
      value: String(Math.round(amount)),
      memo,
    });
  }

  async lookupInvoice(hexRHash: string): Promise<{
    settled?: boolean;
    state?: string;
    value?: string | number;
    settle_date?: number;
  }> {
    // LND REST /v1/invoice/{r_hash_str} parses the path segment as hex.
    return this.req("GET", `/v1/invoice/${hexRHash}`);
  }

  /** Helper: create an invoice and normalise to a simple shape. */
  async createInvoice(amount: number, memo = ""): Promise<Invoice> {
    const raw = await this.addInvoice(amount, memo);
    const rHash = Buffer.from(raw.r_hash, "base64").toString("hex");
    return {
      rHash,
      payReq: raw.payment_request,
      expirySecs: Number(raw.expiry ?? 3600),
    };
  }
}
