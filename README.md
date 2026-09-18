# markets-dashboard

Interactive two-page markets desk for [commodities](#page-1--commodities) and [country equity indexes](#page-2--country-indexes). Built as a Vite + React + TypeScript SPA with Recharts.

**Live (GitHub Pages):** [https://jainamit4.github.io/markets-dashboard/](https://jainamit4.github.io/markets-dashboard/)

That Pages URL is the public browser launch path. Hash routes: [commodities](https://jainamit4.github.io/markets-dashboard/#/) · [country indexes](https://jainamit4.github.io/markets-dashboard/#/indexes)

Repo: [https://github.com/jainamit4/markets-dashboard](https://github.com/jainamit4/markets-dashboard)

This project is a browser-launchable dashboard: live Yahoo Finance series when the API is reachable, and **labeled cached snapshots** when it is not. DRAM and AI energy numbers that are not vendor-published are marked **illustrative / estimated**. Nothing unlabeled is presented as a live market print.

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

**Use the live GitHub Pages site:** [https://jainamit4.github.io/markets-dashboard/](https://jainamit4.github.io/markets-dashboard/). Pushes to `main` build `dist/` and deploy via `.github/workflows/deploy-pages.yml`. Vite `base` is `/markets-dashboard/` so assets, the favicon, and `sample-data/` fetches resolve under that project URL.

Locally, after `npm run build`, `npm run preview` serves the static app (Yahoo proxy still available). On Pages there is no proxy: the app tries Yahoo from the browser, and if CORS/network blocks it, charts fall back to the bundled sample snapshots with a **Sample** badge.

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

In development and `vite preview`, requests go through the Vite proxy so the browser is not blocked by CORS. Direct `query1.finance.yahoo.com` is attempted as a second live path. If both fail, `public/sample-data/*.json` is used. Those JSON files are **cached Yahoo snapshots** captured when the samples were last refreshed — they are labeled **Sample** in the UI.

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
- Time windows: `src/lib/ranges.ts`
- AI panel config: `src/data/aiPricing.ts`
- DRAM config: `src/data/dram.ts`

Not investment advice. Futures, indexes, and token prices move; refresh samples and the AI as-of date when you need a new snapshot.
