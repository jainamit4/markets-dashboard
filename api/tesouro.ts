import { proxyTesouroNtnf10y } from "./_lib/tesouroProxy";

/** Node runtime: streams the official Tesouro Direto CSV and returns compact JSON. */
export const config = { runtime: "nodejs", maxDuration: 60 };

export default proxyTesouroNtnf10y;
