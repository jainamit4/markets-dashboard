import type { SeriesPoint, TimeRange } from "../types";

export type OfficialObservationPayload = {
  provider: "fred" | "tesouro";
  id: string;
  frequency?: "daily" | "monthly";
  unit?: string;
  instrument?: string;
  observations?: SeriesPoint[];
  error?: string;
};

export function filterOfficialByRange(
  points: SeriesPoint[],
  range: TimeRange,
  frequency: "daily" | "monthly" = "monthly",
): SeriesPoint[] {
  if (points.length === 0) return points;
  const last = points[points.length - 1].t;
  const day = 86_400_000;

  if (frequency === "monthly") {
    if (range === "1D" || range === "1W") return points.slice(-1);
    if (range === "1M") return points.slice(-2);
    if (range === "3M") return points.filter((p) => p.t >= last - 100 * day);
    if (range === "YTD") {
      const d = new Date(last);
      const start = Date.UTC(d.getUTCFullYear(), 0, 1);
      const sliced = points.filter((p) => p.t >= start);
      return sliced.length >= 1 ? sliced : points.slice(-1);
    }
    return points.filter((p) => p.t >= last - 370 * day);
  }

  if (range === "1D") return points.filter((p) => p.t >= last - day);
  if (range === "1W") return points.filter((p) => p.t >= last - 7 * day);
  if (range === "1M") return points.filter((p) => p.t >= last - 32 * day);
  if (range === "3M") return points.filter((p) => p.t >= last - 93 * day);
  if (range === "YTD") {
    const d = new Date(last);
    const start = Date.UTC(d.getUTCFullYear(), 0, 1);
    const sliced = points.filter((p) => p.t >= start);
    return sliced.length >= 2 ? sliced : points.slice(-2);
  }
  return points.filter((p) => p.t >= last - 370 * day);
}

/** Strip trailing slashes; accept origin or origin + /api/yahoo. */
function deployedOrigin(): string | undefined {
  const raw = import.meta.env.VITE_YAHOO_PROXY_BASE?.trim();
  if (!raw) return undefined;
  return raw.replace(/\/+$/, "").replace(/\/api\/yahoo$/i, "");
}

export function officialLiveUrls(path: string): string[] {
  const urls: string[] = [];
  const origin = deployedOrigin();
  if (origin) urls.push(`${origin}${path}`);
  urls.push(path);
  return urls;
}

export async function fetchOfficialJson(
  path: string,
  signal: AbortSignal,
): Promise<OfficialObservationPayload> {
  let lastError: unknown;
  for (const url of officialLiveUrls(path)) {
    try {
      const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}`);
      }
      const json = (await res.json()) as OfficialObservationPayload;
      if (json.error) throw new Error(json.error);
      if (!json.observations || json.observations.length < 1) {
        throw new Error("Official payload had no observations");
      }
      return json;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Official live fetch failed");
}
