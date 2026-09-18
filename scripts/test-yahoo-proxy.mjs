/**
 * Path-parser + live Yahoo proxy checks (Node 22 type-stripping).
 * Run: node --experimental-strip-types scripts/test-yahoo-proxy.mjs
 */
import assert from "node:assert/strict";
import {
  proxyYahooChart,
  rawQueryParam,
  resolveYahooRequestUrl,
  yahooPathFromRequestUrl,
} from "../api/_lib/yahooProxy.ts";

const chart = yahooPathFromRequestUrl(
  "https://markets-dashboard-rose.vercel.app/api/yahoo/v8/finance/chart/CL%3DF?range=5d&interval=1d",
);
assert.deepEqual(chart, {
  path: "/v8/finance/chart/CL%3DF",
  search: "?range=5d&interval=1d",
});

assert.equal(
  rawQueryParam("?path=v8/finance/chart/CL=F&range=5d&interval=1d", "path"),
  "v8/finance/chart/CL=F",
);

const rewritten = yahooPathFromRequestUrl(
  "https://markets-dashboard-rose.vercel.app/api/yahoo?path=v8/finance/chart/CL=F&range=5d&interval=1d",
);
assert.deepEqual(rewritten, {
  path: "/v8/finance/chart/CL%3DF",
  search: "?range=5d&interval=1d",
});

const recovered = resolveYahooRequestUrl(
  new Request("https://example.vercel.app/api/yahoo?range=5d", {
    headers: { "x-forwarded-uri": "/api/yahoo/v8/finance/chart/CL%3DF?range=5d&interval=1d" },
  }),
);
assert.equal(
  recovered,
  "https://example.vercel.app/api/yahoo/v8/finance/chart/CL%3DF?range=5d&interval=1d",
);

const rejected = yahooPathFromRequestUrl("https://example.vercel.app/api/yahoo/v8/quote/AAPL");
assert.equal("error" in rejected, true);

const live = await proxyYahooChart(
  new Request(
    "https://markets-dashboard-rose.vercel.app/api/yahoo/v8/finance/chart/CL%3DF?range=5d&interval=1d",
  ),
);
assert.equal(live.status, 200);
const json = await live.json();
assert.equal(json.chart.result[0].meta.symbol, "CL=F");
assert.ok((json.chart.result[0].timestamp?.length ?? 0) >= 2);

console.log("yahoo proxy checks passed");
