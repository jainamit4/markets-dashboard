# markets-dashboard

Interactive two-page markets desk for [commodities](#page-1--commodities) and [country equity indexes](#page-2--country-indexes). Built as a Vite + React + TypeScript SPA with Recharts.

**Deploy this repo to Vercel for Live-always; Pages needs `VITE_YAHOO_PROXY_BASE` pointing at the proxy.**

**Live (GitHub Pages):** [https://jainamit4.github.io/markets-dashboard/](https://jainamit4.github.io/markets-dashboard/)

That Pages URL is the public browser launch path. Hash routes: [commodities](https://jainamit4.github.io/markets-dashboard/#/) · [country indexes](https://jainamit4.github.io/markets-dashboard/#/indexes)

Repo: [https://github.com/jainamit4/markets-dashboard](https://github.com/jainamit4/markets-dashboard)

This project is a browser-launchable dashboard: live Yahoo Finance series when a Yahoo proxy is reachable, and **labeled cached snapshots** when it is not. DRAM and AI energy numbers that are not vendor-published are marked **illustrative / estimated**. Nothing unlabeled is presented as a live market print.

## How Live Yahoo data works

Yahoo’s chart API (`query1.finance.yahoo.com`) does not send CORS headers, so a browser on GitHub Pages cannot read it directly. This repo therefore:

1. **Local `npm run dev` / `npm run preview`** — Vite proxies `/api/yahoo` → `https://query1.finance.yahoo.com` (same as before).
2. **Vercel** — a serverless Edge function at `/api/yahoo` does the same proxy, with CORS for github.io, `*.vercel.app`, and localhost. Nested chart paths are rewritten to that function (Vite does not register Next-style `[...path]` catch-alls). Same-origin `/api/yahoo` is used automatically. **This is the path for always-Live charts.**
3. **GitHub Pages alone** — static hosting, no `/api`. The app still tries Yahoo from the browser, then falls back to **Sample** JSON unless you set `VITE_YAHOO_PROXY_BASE` at build time to a deployed proxy (the Vercel app URL or a Cloudflare Worker).

`fetchYahooLive` in `src/lib/marketData.ts` picks:

- `VITE_YAHOO_PROXY_BASE` + `/api/yahoo/v8/finance/chart/...` when that env var is set
- otherwise relative `/api/yahoo/...` (Vite in development, Vercel in production)
- then direct `query1.finance.yahoo.com` as a last live attempt
- then `public/sample-data/*.json` (labeled **Sample**)

No API keys. The proxy only forwards `/v8/finance/chart/{symbol}`; it does not invent prices.

### Deploy to Vercel (always-Live)

1. Open [Vercel](https://vercel.com) → **Add New…** → **Project** → **Import** `jainamit4/markets-dashboard` (or your fork).
2. Leave the Vite defaults (`npm run build`, output `dist`). Do not set a custom output directory that would skip `/api` functions. `vercel.json` rewrites `/api/yahoo/*` to the flattened `/api/yahoo` function, then falls back to the SPA. Hash routing is unchanged.
3. **Deploy.** Charts on `https://<project>.vercel.app` should show **Live**. After a merge to `main`, GitHub-linked projects auto-redeploy; otherwise use **Redeploy** in the Vercel UI.
4. Confirm the proxy with:

```bash
curl -sS -D - -o /tmp/yahoo-chart.json \
  "https://markets-dashboard-rose.vercel.app/api/yahoo/v8/finance/chart/CL%3DF?range=5d&interval=1d"
```

Expect **HTTP 200** and JSON whose `chart.result[0].meta.symbol` is `CL=F`. A `404` with `x-vercel-error: NOT_FOUND` means the function was not in that deployment.

5. Optional: to keep using GitHub Pages as the public URL with Live data, set repo variable `VITE_YAHOO_PROXY_BASE` to the Vercel origin (no trailing slash), e.g. `https://<project>.vercel.app`. The Pages workflow passes it into `npm run build`.

### Cloudflare Worker (optional, stay on Pages)

If you want Pages + Live without Vercel, deploy the same CORS proxy from `workers/yahoo-proxy/`:

```bash
cd workers/yahoo-proxy
npx wrangler deploy
```

Then set `VITE_YAHOO_PROXY_BASE` to the worker origin (for example `https://markets-dashboard-yahoo-proxy.<account>.workers.dev`) and rebuild Pages.

## Run locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (typically [http://localhost:5173](http://localhost:5173)).

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with a Yahoo Finance proxy (`/api/yahoo` → `query1.finance.yahoo.com`) so live charts work in the browser |
| `npm run build` | Production typecheck + bundle to `dist/` |
| `npm run preview` | Serve `dist/` with the same Yahoo proxy |
| `npm run refresh-samples` | Re-download Yahoo snapshots into `public/sample-data/` (optional maintainer task) |

### Launch from a browser without the dev server

**GitHub Pages:** [https://jainamit4.github.io/markets-dashboard/](https://jainamit4.github.io/markets-dashboard/). Pushes to `main` build `dist/` and deploy via `.github/workflows/deploy-pages.yml`. Vite `base` is `/markets-dashboard/` so assets, the favicon, and `sample-data/` fetches resolve under that project URL.

**Vercel:** Vite `base` is `/` (detected via `VERCEL`). The Edge proxy makes Live the default.

Locally, after `npm run build`, `npm run preview` serves the static app (Yahoo proxy still available). On Pages there is no proxy unless `VITE_YAHOO_PROXY_BASE` is set: the app tries Yahoo from the browser, and if CORS/network blocks it, charts fall back to the bundled sample snapshots with a **Sample** badge.

## What each page shows

### Page 1 — Commodities

- **Metals:** gold (`GC=F`), silver (`SI=F`), copper (`HG=F`), platinum (`PL=F`)
- **Energy & softs:** WTI crude (`CL=F`), cotton (`CT=F`)
- **Memory:** DDR5 16Gb path plus a TrendForce public DRAM/GDDR snapshot table (see [data sources](#data-sources))
- **AI economics:** OpenAI, Anthropic, Kimi (Moonshot), Grok (xAI), Gemini — `$ / 1M` input and output tokens for a representative current model each, plus a **cost per watt** style metric (`est. API $ / kWh` and `¢ / Wh`)

Time range control: **1D / 1W / 1M / 3M / 1Y / YTD**. Hover for tooltips; longer windows include a drag range selector.

### Page 2 — Country indexes

- India — Nifty 50 (`^NSEI`)
- South Korea — KOSPI (`^KS11`)
- Brazil — Bovespa / IBOV (`^BVSP`)
- Chile — S&P IPSA last print (`^IPSA`) + chart of iShares MSCI Chile ETF (`ECH`) because Yahoo does not publish IPSA OHLC history
- China — Shanghai Composite (`000001.SS`)
- Indonesia — Jakarta Composite (`^JKSE`)
- Japan — Nikkei 225 (`^N225`)

Each chart card loads on its own. One failed series does not crash the page.

## Data sources

### Live commodities and indexes

Yahoo Finance chart API (`/v8/finance/chart/{symbol}`).

| Environment | Live path |
| --- | --- |
| `npm run dev` / `preview` | Vite `/api/yahoo` proxy |
| Vercel production | Same-origin `/api/yahoo` Edge function (`/api/yahoo/v8/finance/chart/{symbol}`) |
| GitHub Pages with `VITE_YAHOO_PROXY_BASE` | Deployed Vercel or Worker proxy |
| GitHub Pages without a proxy | Direct Yahoo (usually CORS-blocked) → **Sample** |

Direct `query1.finance.yahoo.com` is attempted as a last live path. If live fetches fail, `public/sample-data/*.json` is used. Those JSON files are **cached Yahoo snapshots** captured when the samples were last refreshed — they are labeled **Sample** in the UI.

| Series | Yahoo symbol | Unit |
| --- | --- | --- |
| WTI crude | `CL=F` | USD / barrel |
| Cotton | `CT=F` | US cents / lb |
| Gold | `GC=F` | USD / troy oz |
| Copper | `HG=F` | USD / lb |
| Silver | `SI=F` | USD / troy oz |
| Platinum | `PL=F` | USD / troy oz |
| Nifty 50 | `^NSEI` | INR |
| KOSPI | `^KS11` | KRW |
| Bovespa | `^BVSP` | BRL |
| S&P IPSA (quote only) | `^IPSA` | CLP |
| MSCI Chile ETF (Chile chart) | `ECH` | USD |
| Shanghai Composite | `000001.SS` | CNY |
| Jakarta Composite | `^JKSE` | IDR |
| Nikkei 225 | `^N225` | JPY |

### Memory (DRAM)

There is no free public DRAM tick API comparable to Yahoo futures. The memory section uses:

- **Latest public prints** copied from [TrendForce DRAM Spot](https://www.trendforce.com/price/dram/dram_spot) (session averages, as-of date in `src/data/dram.ts`)
- An **illustrative monthly path** for DDR5 16Gb (2Gx8) 4800/5600 whose last point is aligned to that TrendForce session average

Both are labeled in the UI. Update `src/data/dram.ts` when refreshing the snapshot.

### AI token pricing (curated JSON)

As-of date lives in `src/data/aiPricing.ts` (`AI_PRICING_AS_OF`). Representative models and official pages:

| Lab | Model | Input / 1M | Output / 1M | Source |
| --- | --- | --- | --- | --- |
| OpenAI | GPT-5.6 Sol (short context) | $4 | $20 | [OpenAI pricing](https://developers.openai.com/api/docs/pricing) |
| Anthropic | Claude Sonnet 5 | $2 | $10 | [Anthropic pricing](https://docs.anthropic.com/en/docs/about-claude/pricing) |
| Kimi | Kimi K3 (cache-miss input) | $3 | $15 | [Kimi K3 pricing](https://platform.kimi.ai/docs/pricing/chat-k3) |
| Grok (xAI) | Grok 4.6, prompts &lt; 200k | $2 | $6 | [xAI pricing](https://docs.x.ai/developers/pricing) |
| Gemini | Gemini 3.1 Pro, prompts ≤ 200k | $2 | $12 | [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing) |

### AI energy / “cost per watt”

Vendors do not publish a standard **$ / watt** for API inference. This dashboard shows an explicit, labeled construct:

1. **Wh / median prompt** — Google published **0.24 Wh** for a median Gemini Apps text prompt (May 2025, full serving stack): [arXiv:2508.15734](https://arxiv.org/abs/2508.15734). Other labs use **illustrative** prompt-energy estimates (Epoch AI’s ~0.3 Wh typical ChatGPT/GPT-4o query is the public anchor, scaled in `src/data/aiPricing.ts`).
2. **Wh / 1M tokens** — converts prompt energy with an **illustrative 500-token median prompt** so labs can be compared.
3. **Est. API $ / kWh** and **¢ / Wh** — blend of input+output token prices divided by that energy estimate.

Only Google’s 0.24 Wh/prompt figure is a published production measurement; everything else in the energy column is **illustrative / estimated**.

## Architecture notes

- Fetch layer: `src/lib/marketData.ts` (live Yahoo → sample JSON)
- Yahoo proxy: `api/yahoo.ts` (Vercel Edge; nested `/api/yahoo/*` rewritten here) and `workers/yahoo-proxy/` (Cloudflare)
- Time windows: `src/lib/ranges.ts`
- AI panel config: `src/data/aiPricing.ts`
- DRAM config: `src/data/dram.ts`

Not investment advice. Futures, indexes, and token prices move; refresh samples and the AI as-of date when you need a new snapshot.
