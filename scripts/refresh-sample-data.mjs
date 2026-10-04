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
  "JPY=X",
  "MXN=X",
  "AUD=X",
  "INR=X",
  "GBP=X",
  "EUR=X",
  "IRR=X",
  "ARS=X",
  "BRL=X",
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

const fredIds = [
  "IRLTLT01JPM156N",
  "IRLTLT01MXM156N",
  "IRLTLT01AUM156N",
  "INDIRLTLT01STM",
  "IRLTLT01GBM156N",
  "IRLTLT01DEM156N",
];

function parseFredCsv(text, seriesId) {
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].split(",");
  const dateIdx = header.findIndex((h) => /observation_date|DATE/i.test(h));
  const valueIdx = header.findIndex((h) => h.trim() === seriesId);
  const points = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const date = cols[dateIdx]?.trim();
    const raw = cols[valueIdx >= 0 ? valueIdx : 1]?.trim();
    if (!date || !raw || raw === ".") continue;
    const v = Number(raw);
    if (!Number.isFinite(v)) continue;
    const [y, m, d] = date.split("-").map(Number);
    points.push({ t: Date.UTC(y, m - 1, d), v });
  }
  return points;
}

for (const seriesId of fredIds) {
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${encodeURIComponent(seriesId)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "markets-dashboard-sample-refresh/1.0", Accept: "text/csv,*/*" },
  });
  if (!res.ok) {
    console.warn(`skip FRED ${seriesId}: HTTP ${res.status}`);
    continue;
  }
  const points = parseFredCsv(await res.text(), seriesId);
  if (points.length < 1) {
    console.warn(`skip FRED ${seriesId}: empty`);
    continue;
  }
  const last = points[points.length - 1];
  const payload = {
    symbol: seriesId,
    fetchedAt: new Date().toISOString(),
    ranges: {
      "1y": {
        interval: "monthly",
        shortName: seriesId,
        regularMarketPrice: last.v,
        points,
      },
    },
  };
  const dest = path.join(outDir, `${seriesId}.json`);
  await fs.writeFile(dest, JSON.stringify(payload));
  console.log("wrote", dest, "n=", points.length, "last=", last.v);
}

const tesouroUrl =
  "https://www.tesourotransparente.gov.br/ckan/dataset/df56aa42-484a-4a59-8184-7676580c81e3/resource/796d2059-14e9-44e3-80c9-2d9e30b405c1/download/precotaxatesourodireto.csv";
const tesouroRes = await fetch(tesouroUrl, {
  headers: { "User-Agent": "markets-dashboard-sample-refresh/1.0", Accept: "text/csv,*/*" },
});
if (tesouroRes.ok) {
  const text = await tesouroRes.text();
  const lines = text.split(/\r?\n/);
  const header = lines[0].replace(/^\uFEFF/, "").split(";");
  const tipoIdx = header.findIndex((h) => /tipo/i.test(h));
  const vencIdx = header.findIndex((h) => /venc/i.test(h));
  const baseIdx = header.findIndex((h) => /data base/i.test(h));
  const vendaIdx = header.findIndex((h) => /taxa venda/i.test(h));
  const parseBrDate = (value) => {
    const [d, m, y] = value.trim().split("/").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  const parseBrNumber = (value) => Number(value.trim().replace(/\./g, "").replace(",", "."));
  const best = new Map();
  const cutoff = Date.UTC(new Date().getUTCFullYear() - 5, 0, 1);
  for (const line of lines.slice(1)) {
    if (!line) continue;
    const cols = line.split(";");
    if (cols[tipoIdx]?.trim() !== "Tesouro Prefixado com Juros Semestrais") continue;
    const t = parseBrDate(cols[baseIdx] ?? "");
    const venc = parseBrDate(cols[vencIdx] ?? "");
    const v = parseBrNumber(cols[vendaIdx] ?? "");
    if (!Number.isFinite(t) || !Number.isFinite(venc) || !Number.isFinite(v) || venc <= t) continue;
    if (t < cutoff) continue;
    const abs = Math.abs((venc - t) / (365.25 * 86_400_000) - 10);
    const prev = best.get(t);
    if (!prev || abs < prev.abs) best.set(t, { abs, v, instrument: cols[vencIdx].trim() });
  }
  const points = [...best.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([t, row]) => ({ t, v: row.v }));
  if (points.length >= 2) {
    const last = points[points.length - 1];
    const dest = path.join(outDir, "NTNF_NEAREST_10Y.json");
    await fs.writeFile(
      dest,
      JSON.stringify({
        symbol: "NTNF-NEAREST-10Y",
        fetchedAt: new Date().toISOString(),
        ranges: {
          "1y": {
            interval: "1d",
            shortName: "Tesouro NTN-F nearest 10y",
            regularMarketPrice: last.v,
            points,
          },
        },
      }),
    );
    console.log("wrote", dest, "n=", points.length, "last=", last.v);
  } else {
    console.warn("skip Tesouro NTN-F: too few official prints");
  }
} else {
  console.warn(`skip Tesouro: HTTP ${tesouroRes.status}`);
}
