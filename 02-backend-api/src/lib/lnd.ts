/*
 * LND REST client + Polar auto-detection.
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
  macaroonHex?: string;
}

export interface Invoice {
  rHash: string;
  payReq: string;
  expirySecs: number;
}

const POLAR_NETWORKS_FILE = path.join(
  os.homedir(),
  ".polar",
  "networks",
  "networks.json"
);

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

export function resolveConfig(preferName = "alice"): LndConfig {
  const envDir = process.env.LND_DIR;
  const envHost = process.env.REST_HOST;
  if (envHost && (envDir || process.env.LND_MACAROON_HEX)) {
    return {
      lndDir: envDir ?? "",
      restHost: envHost,
      nodeName: preferName,
      macaroonHex: process.env.LND_MACAROON_HEX,
    };
  }
  return (
    findPolarNode(preferName) ?? {
      lndDir: path.join(os.homedir(), "bootcamp-code", "alice"),
      restHost: "https://127.0.0.1:8084",
      nodeName: preferName,
    }
  );
}

/**
 * Resolve a named node's LND config, distinct from the default alice
 * config - used for a farmer stand-in wallet that receives payouts.
 */
export function resolveNamedConfig(nodeName: string): LndConfig {
  const upper = nodeName.toUpperCase();
  const envHost = process.env[upper + "_REST_HOST"];
  const envDir = process.env[upper + "_LND_DIR"];
  const envMac = process.env[upper + "_LND_MACAROON_HEX"];
  if (envHost && (envDir || envMac)) {
    return { lndDir: envDir ?? "", restHost: envHost, nodeName, macaroonHex: envMac };
  }
  const found = findPolarNode(nodeName);
  if (found) return found;
  throw new Error(
    "No LND config for node \"" + nodeName + "\". Set " + upper + "_REST_HOST + " + upper + "_LND_MACAROON_HEX, or run against a local Polar network with that node."
  );
}

export class LndClient {
  private macaroonHex = "";

  constructor(private config: LndConfig) {
    const fromConfig = config.macaroonHex?.trim();
    const fromEnv = fromConfig || process.env.LND_MACAROON_HEX?.trim();
    if (fromEnv) {
      this.macaroonHex = fromEnv;
      return;
    }
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
        this.config.lndDir
          ? `LND not found at ${this.config.lndDir}. Make sure a Polar LND node is running.`
          : "No LND credential. Set LND_MACAROON_HEX (hosted) or LND_DIR (local)."
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
    return this.req("GET", `/v1/invoice/${hexRHash}`);
  }

  async createInvoice(amount: number, memo = ""): Promise<Invoice> {
    const raw = await this.addInvoice(amount, memo);
    const rHash = Buffer.from(raw.r_hash, "base64").toString("hex");
    return {
      rHash,
      payReq: raw.payment_request,
      expirySecs: Number(raw.expiry ?? 3600),
    };
  }

  async payInvoice(paymentRequest: string): Promise<{
    paid: boolean;
    paymentHash?: string;
    preimage?: string;
    error?: string;
  }> {
    const raw = await this.req<{
      payment_error?: string;
      payment_preimage?: string;
      payment_hash?: string;
    }>("POST", "/v1/channels/transactions", { payment_request: paymentRequest });
    if (raw.payment_error) {
      return { paid: false, error: raw.payment_error };
    }
    return {
      paid: true,
      paymentHash: raw.payment_hash
        ? Buffer.from(raw.payment_hash, "base64").toString("hex")
        : undefined,
      preimage: raw.payment_preimage
        ? Buffer.from(raw.payment_preimage, "base64").toString("hex")
        : undefined,
    };
  }
}
