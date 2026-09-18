import { proxyYahooChart } from "./_lib/yahooProxy";

/** Flattened Edge entry. Nested `/api/yahoo/*` is rewritten here (Vite has no Next catch-all). */
export const config = { runtime: "edge" };

export default proxyYahooChart;
