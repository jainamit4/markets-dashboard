import { proxyFredSeries } from "./_lib/fredProxy";

/** Flattened Edge entry. Nested `/api/fred/*` is rewritten here. */
export const config = { runtime: "edge" };

export default proxyFredSeries;
