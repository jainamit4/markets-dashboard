import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

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

export default defineConfig({
  base: "/markets-dashboard/",
  plugins: [react()],
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
