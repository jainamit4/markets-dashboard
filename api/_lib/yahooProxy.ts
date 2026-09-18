/**
 * Shared Yahoo Finance chart proxy for Vercel Edge and Cloudflare Workers.
 * No API keys; forwards public chart JSON only.
 */

export const YAHOO_ORIGIN = "https://query1.finance.yahoo.com";

export const YAHOO_USER_AGENT =
  "Mozilla/5.0 (compatible; markets-dashboard/1.0; +https://github.com/jainamit4/markets-dashboard)";

const CHART_PREFIX = "/v8/finance/chart/";
const SYMBOL = /^[-^=._A-Za-z0-9]+$/;
const QUERY_KEYS = ["range", "interval", "includePrePost"] as const;

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  const host = url.hostname;
  if (host === "localhost" || host === "127.0.0.1") return true;
  if (host === "jainamit4.github.io" || host.endsWith(".github.io")) return true;
  if (host.endsWith(".vercel.app")) return true;
  if (host.endsWith(".workers.dev")) return true;
  return false;
}

export function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Accept, Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (origin && isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function decodePath(pathname: string): string {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

export function yahooPathFromRequestUrl(
  requestUrl: string,
): { path: string; search: string } | { error: string } {
  const url = new URL(requestUrl);
  let pathname = decodePath(url.pathname);
  for (const prefix of ["/api/yahoo", "/yahoo"]) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      pathname = pathname.slice(prefix.length) || "/";
      break;
    }
  }
  if (!pathname.startsWith("/")) pathname = `/${pathname}`;
  if (!pathname.startsWith(CHART_PREFIX)) {
    return { error: "Only /v8/finance/chart/{symbol} is proxied" };
  }
  const symbol = pathname.slice(CHART_PREFIX.length);
  if (!symbol || symbol.includes("/") || !SYMBOL.test(symbol)) {
    return { error: "Only /v8/finance/chart/{symbol} is proxied" };
  }
  const params = new URLSearchParams();
  for (const key of QUERY_KEYS) {
    const value = url.searchParams.get(key);
    if (value) params.set(key, value);
  }
  const search = params.toString();
  return {
    path: `${CHART_PREFIX}${encodeURIComponent(symbol)}`,
    search: search ? `?${search}` : "",
  };
}

function json(data: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...cors,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export async function proxyYahooChart(request: Request): Promise<Response> {
  const origin = request.headers.get("Origin");
  const cors = corsHeaders(origin);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (request.method !== "GET") {
    return json({ error: "Method not allowed" }, 405, cors);
  }

  const parsed = yahooPathFromRequestUrl(request.url);
  if ("error" in parsed) {
    return json({ error: parsed.error }, 400, cors);
  }

  const target = `${YAHOO_ORIGIN}${parsed.path}${parsed.search}`;
  try {
    const upstream = await fetch(target, {
      method: "GET",
      headers: {
        "User-Agent": YAHOO_USER_AGENT,
        Accept: "application/json",
      },
    });
    const body = await upstream.arrayBuffer();
    const contentType = upstream.headers.get("Content-Type") ?? "application/json; charset=utf-8";
    return new Response(body, {
      status: upstream.status,
      headers: {
        ...cors,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upstream fetch failed";
    return json({ error: message }, 502, cors);
  }
}
