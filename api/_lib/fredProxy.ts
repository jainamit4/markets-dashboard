import { corsHeaders, handleCorsPreamble, jsonResponse } from "./cors";

export const FRED_GRAPH = "https://fred.stlouisfed.org/graph/fredgraph.csv";

export const FRED_SERIES_IDS = [
  "IRLTLT01JPM156N",
  "IRLTLT01MXM156N",
  "IRLTLT01AUM156N",
  "INDIRLTLT01STM",
  "IRLTLT01GBM156N",
  "IRLTLT01DEM156N",
] as const;

const ALLOWED = new Set<string>(FRED_SERIES_IDS);

const USER_AGENT =
  "Mozilla/5.0 (compatible; markets-dashboard/1.0; +https://github.com/jainamit4/markets-dashboard)";

export type OfficialPoint = { t: number; v: number };

export function parseFredCsv(text: string, seriesId: string): OfficialPoint[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = lines[0].split(",");
  const dateIdx = header.findIndex((h) => /observation_date|DATE/i.test(h));
  const valueIdx = header.findIndex((h) => h.trim() === seriesId) >= 0
    ? header.findIndex((h) => h.trim() === seriesId)
    : header.findIndex((_, i) => i !== dateIdx);
  if (dateIdx < 0 || valueIdx < 0) return [];
  const points: OfficialPoint[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const date = cols[dateIdx]?.trim();
    const raw = cols[valueIdx]?.trim();
    if (!date || !raw || raw === "." || raw === "NA") continue;
    const v = Number(raw);
    if (!Number.isFinite(v)) continue;
    const parts = date.split("-").map(Number);
    if (parts.length < 3 || parts.some((n) => !Number.isFinite(n))) continue;
    const t = Date.UTC(parts[0], parts[1] - 1, parts[2]);
    points.push({ t, v });
  }
  return points;
}

export async function fetchFredObservations(seriesId: string, signal?: AbortSignal): Promise<OfficialPoint[]> {
  if (!ALLOWED.has(seriesId)) {
    throw new Error(`FRED series ${seriesId} is not allowlisted`);
  }
  const url = `${FRED_GRAPH}?id=${encodeURIComponent(seriesId)}`;
  const res = await fetch(url, {
    signal,
    headers: { "User-Agent": USER_AGENT, Accept: "text/csv,*/*" },
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  const text = await res.text();
  const points = parseFredCsv(text, seriesId);
  if (points.length < 1) {
    throw new Error(`FRED ${seriesId} returned no observations`);
  }
  return points;
}

function seriesIdFromRequest(request: Request): string | { error: string } {
  const url = new URL(request.url);
  const queryId = url.searchParams.get("id")?.trim();
  if (queryId) {
    return ALLOWED.has(queryId) ? queryId : { error: "Unknown FRED series" };
  }
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.lastIndexOf("series");
  const fromPath = idx >= 0 ? parts[idx + 1] : parts[parts.length - 1];
  if (!fromPath || fromPath === "fred") return { error: "Missing FRED series id" };
  return ALLOWED.has(fromPath) ? fromPath : { error: "Unknown FRED series" };
}

export async function proxyFredSeries(request: Request): Promise<Response> {
  const pre = await handleCorsPreamble(request);
  if (pre instanceof Response) return pre;
  const { cors } = pre;

  const parsed = seriesIdFromRequest(request);
  if (typeof parsed !== "string") {
    return jsonResponse({ error: parsed.error }, 400, cors);
  }

  try {
    const observations = await fetchFredObservations(parsed);
    return jsonResponse(
      {
        provider: "fred",
        id: parsed,
        frequency: "monthly",
        unit: "Percent",
        observations,
      },
      200,
      cors,
      "public, max-age=0, s-maxage=3600, stale-while-revalidate=7200",
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "FRED fetch failed";
    const status = /^404\b/.test(message) ? 404 : 502;
    return jsonResponse({ error: message }, status, pre.cors ?? corsHeaders(request.headers.get("Origin")));
  }
}
