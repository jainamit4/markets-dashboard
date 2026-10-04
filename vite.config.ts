import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { proxyFredSeries } from "./api/_lib/fredProxy";
import { proxyTesouroNtnf10y } from "./api/_lib/tesouroProxy";

const hostedOnVercel = Boolean(
  (globalThis as { process?: { env?: { VERCEL?: string } } }).process?.env?.VERCEL,
);

const yahooProxy = {
  "/api/yahoo": {
    target: "https://query1.finance.yahoo.com",
    changeOrigin: true,
    secure: true,
    rewrite: (path: string) => path.replace(/^\/api\/yahoo/, ""),
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; markets-dashboard/1.0; +https://github.com/jainamit4/markets-dashboard)",
      Accept: "application/json",
    },
  },
} as const;

function officialYieldApi(): Plugin {
  const middleware = async (req: any, res: any, next: () => void) => {
    const url = req.url ?? "";
    if (!url.startsWith("/api/fred") && !url.startsWith("/api/tesouro")) {
      next();
      return;
    }
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers ?? {})) {
      if (typeof value === "string") headers.set(key, value);
      else if (Array.isArray(value)) headers.set(key, value.join(","));
    }
    const request = new Request(new URL(url, "http://127.0.0.1"), {
      method: req.method,
      headers,
    });
    const response = url.startsWith("/api/tesouro")
      ? await proxyTesouroNtnf10y(request)
      : await proxyFredSeries(request);
    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.end(new Uint8Array(await response.arrayBuffer()));
  };

  return {
    name: "official-yield-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        void middleware(req, res, next);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        void middleware(req, res, next);
      });
    },
  };
}

export default defineConfig({
  // GitHub Pages is served under /markets-dashboard/; Vercel hosts at /
  base: hostedOnVercel ? "/" : "/markets-dashboard/",
  plugins: [react(), officialYieldApi()],
  server: {
    host: true,
    port: 5173,
    proxy: yahooProxy,
  },
  preview: {
    host: true,
    port: 4173,
    proxy: yahooProxy,
  },
});
