import { env } from "@/lib/env";
import type { KbErrorResponse } from "./types";

const USER_AGENT = `${env.NEXT_PUBLIC_APP_NAME}/0.1 (+${env.NEXT_PUBLIC_APP_URL})`;

export class KickbaseError extends Error {
  status: number;
  err?: number;
  errMsg?: string;
  body?: unknown;

  constructor(opts: { message: string; status: number; err?: number; errMsg?: string; body?: unknown }) {
    super(opts.message);
    this.name = "KickbaseError";
    this.status = opts.status;
    this.err = opts.err;
    this.errMsg = opts.errMsg;
    this.body = opts.body;
  }

  /** Returns true for 401/403 — token expired or rejected */
  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

interface RequestOptions {
  /** Bearer token. If unset, no Authorization header is sent. */
  token?: string;
  /** Query params */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Request body (will be JSON-encoded) */
  body?: unknown;
  /** Override method (default GET if no body, POST if body) */
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  /** Per-request timeout in ms */
  timeoutMs?: number;
  /** Skip Bearer prefix if you want to send a raw Authorization value */
  rawAuth?: boolean;
  /** Cache control for Next fetch */
  next?: { revalidate?: number; tags?: string[] };
  /** Whether to pass `cache: "no-store"` (default true for authed calls) */
  noStore?: boolean;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(path, env.KICKBASE_API_BASE);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function kbFetch<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = buildUrl(path, opts.query);
  const method = opts.method ?? (opts.body !== undefined ? "POST" : "GET");

  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": USER_AGENT,
    "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
  };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.token) {
    headers["Authorization"] = opts.rawAuth ? opts.token : `Bearer ${opts.token}`;
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 15_000);

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: ctrl.signal,
      cache: opts.next ? undefined : opts.noStore === false ? "default" : "no-store",
      next: opts.next,
    });
  } catch (e) {
    clearTimeout(timer);
    const msg = e instanceof Error ? e.message : "Network error";
    throw new KickbaseError({ message: `Kickbase fetch failed: ${msg}`, status: 0 });
  }
  clearTimeout(timer);

  let json: unknown;
  const text = await res.text();
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
  }

  if (!res.ok) {
    const errBody = json as KbErrorResponse | undefined;
    throw new KickbaseError({
      message: `Kickbase ${res.status} on ${method} ${path}: ${errBody?.errMsg ?? text.slice(0, 120)}`,
      status: res.status,
      err: errBody?.err,
      errMsg: errBody?.errMsg,
      body: json,
    });
  }

  return json as T;
}
