import type { TimeRange } from "../types";

export const TIME_RANGES: TimeRange[] = ["1D", "1W", "1M", "3M", "1Y", "YTD"];

export function yahooParams(range: TimeRange): { range: string; interval: string } {
  switch (range) {
    case "1D":
      return { range: "1d", interval: "5m" };
    case "1W":
      return { range: "5d", interval: "15m" };
    case "1M":
      return { range: "1mo", interval: "1d" };
    case "3M":
      return { range: "3mo", interval: "1d" };
    case "1Y":
      return { range: "1y", interval: "1d" };
    case "YTD":
      return { range: "ytd", interval: "1d" };
  }
}

export function sampleRangeKey(range: TimeRange): "1d" | "5d" | "1y" {
  if (range === "1D") return "1d";
  if (range === "1W") return "5d";
  return "1y";
}

export function filterPointsByRange<T extends { t: number }>(
  points: T[],
  range: TimeRange,
): T[] {
  if (points.length === 0) return points;
  const last = points[points.length - 1].t;
  const day = 86_400_000;
  if (range === "1D") {
    const cut = last - day;
    const sliced = points.filter((p) => p.t >= cut);
    return sliced.length >= 2 ? sliced : points.slice(-24);
  }
  if (range === "1W") {
    const cut = last - 7 * day;
    const sliced = points.filter((p) => p.t >= cut);
    return sliced.length >= 2 ? sliced : points.slice(-40);
  }
  if (range === "1M") {
    return points.filter((p) => p.t >= last - 32 * day);
  }
  if (range === "3M") {
    return points.filter((p) => p.t >= last - 93 * day);
  }
  if (range === "YTD") {
    const d = new Date(last);
    const start = Date.UTC(d.getUTCFullYear(), 0, 1);
    const sliced = points.filter((p) => p.t >= start);
    return sliced.length >= 2 ? sliced : points;
  }
  return points;
}

export function windowChange(points: { v: number }[]): { abs: number; pct: number } | null {
  if (points.length < 2) return null;
  const first = points[0].v;
  const last = points[points.length - 1].v;
  if (!Number.isFinite(first) || first === 0) return null;
  return { abs: last - first, pct: ((last - first) / first) * 100 };
}
