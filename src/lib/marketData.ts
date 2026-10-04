import type { DataSource, MarketSeries, SeriesPoint, SeriesSpec, TimeRange } from "../types";
import { filterPointsByRange, sampleRangeKey, yahooParams } from "./ranges";

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        currency?: string;
        symbol?: string;
        shortName?: string;
        regularMarketPrice?: number;
        chartPreviousClose?: number;
      };
      timestamp?: number[];
      indicators?: { quote?: Array<{ close?: Array<number | null> }> };
    }>;
    error?: { description?: string } | null;
  };
};

type SampleFile = {
  symbol: string;
  fetchedAt: string;
  ranges: Record<
    string,
    {
      interval: string;
      currency?: string;
      shortName?: string;
      regularMarketPrice?: number;
      points: SeriesPoint[];
    }
  >;
};

const sampleCache = new Map<string, Promise<SampleFile>>();

function parseYahoo(json: YahooChartResponse, symbol: string): {
  points: SeriesPoint[];
  currency?: string;
  last?: number;
  shortName?: string;
} {
  const result = json.chart?.result?.[0];
  if (!result) {
    throw new Error(json.chart?.error?.description || `No Yahoo chart data for ${symbol}`);
  }
  const timestamps = result.timestamp ?? [];
  const closes = result.indicators?.quote?.[0]?.close ?? [];
  const points: SeriesPoint[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const close = closes[i];
    if (close == null || !Number.isFinite(close)) continue;
    points.push({ t: timestamps[i] * 1000, v: close });
  }
  const lastFromMeta = result.meta?.regularMarketPrice;
  const last = lastFromMeta ?? points[points.length - 1]?.v;
  return {
    points,
    currency: result.meta?.currency,
    last,
    shortName: result.meta?.shortName,
  };
}

async function fetchJson(url: string, signal: AbortSignal): Promise<unknown> {
  const res = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return res.json();
}

/** Strip trailing slashes; accept either origin or origin + /api/yahoo. */
function yahooProxyPrefixFromEnv(): string | undefined {
  const raw = import.meta.env.VITE_YAHOO_PROXY_BASE?.trim();
  if (!raw) return undefined;
  const base = raw.replace(/\/+$/, "");
  if (/\/api\/yahoo$/i.test(base)) return base;
  return `${base}/api/yahoo`;
}

function yahooLiveUrls(symbol: string, query: string): string[] {
  const encoded = encodeURIComponent(symbol);
  const pathAndQuery = `/v8/finance/chart/${encoded}?${query}`;
  const urls: string[] = [];
  const configured = yahooProxyPrefixFromEnv();
  if (configured) {
    urls.push(`${configured}${pathAndQuery}`);
  } else {
    // Vite dev/preview proxy, or Vercel same-origin serverless `/api/yahoo`
    urls.push(`/api/yahoo${pathAndQuery}`);
  }
  urls.push(`https://query1.finance.yahoo.com${pathAndQuery}`);
  return urls;
}

async function fetchYahooQuery(
  symbol: string,
  query: string,
  signal: AbortSignal,
): Promise<ReturnType<typeof parseYahoo>> {
  const urls = yahooLiveUrls(symbol, query);
  let lastError: unknown;
  for (const url of urls) {
    try {
      const json = (await fetchJson(url, signal)) as YahooChartResponse;
      return parseYahoo(json, symbol);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Yahoo live fetch failed");
}

function fetchYahooLive(
  symbol: string,
  range: TimeRange,
  signal: AbortSignal,
): Promise<ReturnType<typeof parseYahoo>> {
  const { range: yahooRange, interval } = yahooParams(range);
  return fetchYahooQuery(symbol, `range=${yahooRange}&interval=${interval}&includePrePost=false`, signal);
}

/**
 * On weekends and holidays Yahoo answers range=1d with HTTP 200 but zero bars,
 * so the last real session is recovered from a 5d window at the same interval.
 */
function fetchYahooLastSession(
  symbol: string,
  signal: AbortSignal,
): Promise<ReturnType<typeof parseYahoo>> {
  return fetchYahooQuery(symbol, "range=5d&interval=5m&includePrePost=false", signal);
}

/**
 * Last-resort live path for the 1D range: slice the most recent 24 hours of
 * trading out of the 5d series. Returns null when the symbol genuinely has no
 * recent bars, so the caller can still fall back to the labeled sample.
 */
async function recoverLastSession(
  symbol: string,
  signal: AbortSignal,
): Promise<{ points: SeriesPoint[]; currency?: string } | null> {
  try {
    const wide = await fetchYahooLastSession(symbol, signal);
    const points = filterPointsByRange(wide.points, "1D");
    if (points.length < 2) return null;
    return { points, currency: wide.currency };
  } catch {
    return null;
  }
}

function loadSampleFile(file: string): Promise<SampleFile> {
  const existing = sampleCache.get(file);
  if (existing) return existing;
  const pending = fetch(`${import.meta.env.BASE_URL}sample-data/${file}`)
    .then(async (res) => {
      if (!res.ok) throw new Error(`Sample ${file} missing (${res.status})`);
      return (await res.json()) as SampleFile;
    })
    .catch((err) => {
      sampleCache.delete(file);
      throw err;
    });
  sampleCache.set(file, pending);
  return pending;
}

function fromSampleFile(
  file: SampleFile,
  range: TimeRange,
): { points: SeriesPoint[]; currency?: string; last?: number; interval?: string; fetchedAt: string } {
  const key = sampleRangeKey(range);
  const bucket = file.ranges[key] ?? file.ranges["1y"];
  if (!bucket) {
    throw new Error(`Sample has no series for ${file.symbol}`);
  }
  let points = bucket.points ?? [];
  if (key === "1y") {
    points = filterPointsByRange(points, range);
  }
  if (points.length < 2 && file.ranges["1y"]?.points) {
    points = filterPointsByRange(file.ranges["1y"].points, range);
  }
  return {
    points,
    currency: bucket.currency,
    last: bucket.regularMarketPrice ?? points[points.length - 1]?.v,
    interval: bucket.interval,
    fetchedAt: file.fetchedAt,
  };
}

export async function loadMarketSeries(
  spec: SeriesSpec,
  range: TimeRange,
  signal: AbortSignal,
): Promise<MarketSeries> {
  const { interval } = yahooParams(range);
  let liveError: string | undefined;

  try {
    const live = await fetchYahooLive(spec.symbol, range, signal);
    let points = live.points;
    let last = live.last;
    let note = spec.note;
    let quotePrint: MarketSeries["quotePrint"];

    if (spec.quoteSymbol) {
      try {
        const quote = await fetchYahooLive(spec.quoteSymbol, "1D", signal);
        if (quote.last != null) {
          quotePrint = {
            label: "S&P IPSA last",
            last: quote.last,
            currency: quote.currency,
          };
        }
      } catch {
        /* quote is best-effort */
      }
    }

    if (points.length >= 2) {
      return {
        symbol: spec.symbol,
        title: spec.title,
        unit: spec.unit,
        currency: live.currency,
        points,
        last,
        source: "live" satisfies DataSource,
        sourceLabel: `Yahoo Finance ${spec.symbol}`,
        note,
        fetchedAt: new Date().toISOString(),
        interval,
        quotePrint,
      };
    }

    if (range === "1D") {
      const recovered = await recoverLastSession(spec.symbol, signal);
      if (recovered) {
        return {
          symbol: spec.symbol,
          title: spec.title,
          unit: spec.unit,
          currency: recovered.currency ?? live.currency,
          points: recovered.points,
          last: recovered.points[recovered.points.length - 1].v,
          source: "live" satisfies DataSource,
          sourceLabel: `Yahoo Finance ${spec.symbol}`,
          note: [
            spec.note,
            "Market closed — Yahoo's 1d window returned no bars, so the chart shows the last 24 hours of trading from the live 5d series.",
          ]
            .filter(Boolean)
            .join(" "),
          fetchedAt: new Date().toISOString(),
          interval: "5m",
          quotePrint,
        };
      }
    }
    liveError = "Live payload had too few points";
  } catch (err) {
    liveError = err instanceof Error ? err.message : "Live fetch failed";
  }

  const sample = fromSampleFile(await loadSampleFile(spec.sampleFile), range);
  if (sample.points.length < 1) {
    throw new Error(liveError || `No data for ${spec.symbol}`);
  }

  return {
    symbol: spec.symbol,
    title: spec.title,
    unit: spec.unit,
    currency: sample.currency,
    points: sample.points,
    last: sample.last,
    source: "sample",
    sourceLabel: `Cached Yahoo snapshot (${spec.symbol})`,
    note: [
      spec.note,
      liveError
        ? `Live feed unavailable (${liveError}). Showing labeled sample snapshot.`
        : "Showing labeled sample snapshot.",
    ]
      .filter(Boolean)
      .join(" "),
    fetchedAt: sample.fetchedAt,
    interval: sample.interval ?? interval,
  };
}
