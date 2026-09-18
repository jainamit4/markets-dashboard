# Yahoo CORS proxy (Cloudflare Worker)

Same behavior as the Vercel function in `api/yahoo/[...path].ts`: forward `/api/yahoo/v8/finance/chart/{symbol}` to Yahoo with a browser User-Agent, and allow github.io / Vercel / localhost origins.

```bash
cd workers/yahoo-proxy
npx wrangler deploy
```

Then set `VITE_YAHOO_PROXY_BASE` to the worker origin (no trailing slash) so GitHub Pages can show **Live** charts. Example: `https://markets-dashboard-yahoo-proxy.<account>.workers.dev`.
