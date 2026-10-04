export type TimeRange = "1D" | "1W" | "1M" | "3M" | "1Y" | "YTD";

export type DataSource = "live" | "sample";

export type SeriesPoint = {
  t: number;
  v: number;
};

export type MarketSeries = {
  symbol: string;
  title: string;
  unit: string;
  currency?: string;
  points: SeriesPoint[];
  last?: number;
  source: DataSource;
  sourceLabel: string;
  note?: string;
  fetchedAt: string;
  interval?: string;
  quotePrint?: { label: string; last: number; currency?: string };
};

export type SeriesSpec = {
  id: string;
  title: string;
  subtitle?: string;
  symbol: string;
  /** Optional second symbol used only for a last print (e.g. IPSA quote). */
  quoteSymbol?: string;
  unit: string;
  /** Cached Yahoo snapshot. Omit when no real public series exists — do not invent points. */
  sampleFile?: string;
  accent: "gold" | "teal" | "copper" | "silver";
  note?: string;
  /**
   * Honest copy when Yahoo has no loadable series for this card.
   * Live is still attempted when `symbol` is set; if it fails and there is no sample, the card
   * shows this instead of a made-up chart.
   */
  unavailableReason?: string;
};

export type LoadState<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "error"; message: string; data?: T }
  | { status: "unavailable"; message: string };
