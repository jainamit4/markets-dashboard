/**
 * Refresh cached Yahoo Finance snapshots used when live APIs are blocked.
 * Usage: npm run refresh-samples
 */
const fs = await import("node:fs/promises");
const path = await import("node:path");

const symbols = [
  "CL=F",
  "CT=F",
  "GC=F",
  "HG=F",
  "SI=F",
  "PL=F",
  "^NSEI",
  "^KS11",
  "^BVSP",
  "^IPSA",
  "000001.SS",
  "^JKSE",
  "^N225",
  "ECH",
];

const ranges = [
  ["1d", "5m"],
  ["5d", "15m"],
  ["1y", "1d"],
];

const outDir = path.resolve("public/sample-data");
await fs.mkdir(outDir, { recursive: true });

function fileName(symbol) {
  return `${symbol.replaceAll("^", "_").replaceAll("=", "_").replaceAll(".", "_")}.json`;
}

for (const symbol of symbols) {
  const payload = {
    symbol,
    fetchedAt: new Date().toISOString(),
    ranges: {},
  };
  for (const [range, interval] of ranges) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "markets-dashboard-sample-refresh/1.0",
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      console.warn(`skip ${symbol} ${range}: HTTP ${res.status}`);
      continue;
    }
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) {
      console.warn(`skip ${symbol} ${range}: empty result`);
      continue;
    }
    const timestamps = result.timestamp ?? [];
    const closes = result.indicators?.quote?.[0]?.close ?? [];
    const points = [];
    for (let i = 0; i < timestamps.length; i++) {
      const close = closes[i];
      if (close == null || !Number.isFinite(close)) continue;
      points.push({ t: timestamps[i] * 1000, v: close });
    }
    payload.ranges[range] = {
      interval,
      currency: result.meta?.currency,
      shortName: result.meta?.shortName,
      regularMarketPrice: result.meta?.regularMarketPrice,
      points,
    };
    console.log(`${symbol} ${range} n=${points.length}`);
  }
  const dest = path.join(outDir, fileName(symbol));
  await fs.writeFile(dest, JSON.stringify(payload));
  console.log("wrote", dest);
}
