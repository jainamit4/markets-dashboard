/** Shared CORS allowlist for public-data proxies (Yahoo, FRED, Tesouro). */

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

export function jsonResponse(
  data: unknown,
  status: number,
  cors: Record<string, string>,
  cacheControl = "public, max-age=0, s-maxage=300, stale-while-revalidate=600",
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...cors,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cacheControl,
    },
  });
}

export async function handleCorsPreamble(request: Request): Promise<Response | { cors: Record<string, string> }> {
  const origin = request.headers.get("Origin");
  const cors = corsHeaders(origin);
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (request.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405, cors);
  }
  return { cors };
}
