import type { SeriesPoint } from "../types";

export const DRAM_AS_OF = "2026-09-18";
export const DRAM_SOURCE_LABEL = "TrendForce DRAM Spot (public page)";
export const DRAM_SOURCE_URL = "https://www.trendforce.com/price/dram/dram_spot";

export type DramProduct = {
  name: string;
  usd: number;
  changePct?: number;
};

/** Session averages copied from TrendForce’s public DRAM spot table on DRAM_AS_OF. */
export const dramSpotSnapshot: DramProduct[] = [
  { name: "DDR5 16Gb 4800/5600", usd: 54.333, changePct: 0 },
  { name: "DDR5 16Gb eTT", usd: 24.2, changePct: 0 },
  { name: "DDR4 16Gb 3200", usd: 89.25, changePct: -0.56 },
  { name: "DDR4 16Gb eTT", usd: 12.55, changePct: 0.8 },
  { name: "DDR4 8Gb 3200", usd: 45.571, changePct: 0.79 },
  { name: "DDR4 8Gb eTT", usd: 5.4, changePct: 1.7 },
  { name: "DDR3 4Gb 1600/1866", usd: 13.81, changePct: 0 },
  { name: "GDDR6 8Gb", usd: 11.844, changePct: 0.48 },
];

/**
 * Illustrative monthly path for the DDR5 16Gb 4800/5600 contract/spot complex.
 * Latest point is aligned to TrendForce’s public session average.
 * Intermediate months are a demo reconstruction, not a tick-by-tick DRAM exchange feed.
 */
export const dramIllustrativeSeries: SeriesPoint[] = [
  { t: Date.parse("2024-09-30T00:00:00Z"), v: 4.6 },
  { t: Date.parse("2024-12-31T00:00:00Z"), v: 5.4 },
  { t: Date.parse("2025-03-31T00:00:00Z"), v: 7.1 },
  { t: Date.parse("2025-06-30T00:00:00Z"), v: 10.8 },
  { t: Date.parse("2025-09-30T00:00:00Z"), v: 16.5 },
  { t: Date.parse("2025-12-31T00:00:00Z"), v: 24.0 },
  { t: Date.parse("2026-03-31T00:00:00Z"), v: 34.5 },
  { t: Date.parse("2026-06-30T00:00:00Z"), v: 46.0 },
  { t: Date.parse("2026-07-31T00:00:00Z"), v: 50.2 },
  { t: Date.parse("2026-09-18T00:00:00Z"), v: 54.333 },
];
