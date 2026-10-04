export type TimeRange = "1D" | "1W" | "1M" | "3M" | "1Y" | "YTD";

export type DataSource = "live" | "sample";

export type SeriesProvider = "yahoo" | "fred" | "tesouro";

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
  /** Cached snapshot (Yahoo or official). Omit when no real public series exists. */
  sampleFile?: string;
  accent: "gold" | "teal" | "copper" | "silver";
  note?: string;
  /** Live fetch path. Default yahoo. */
  provider?: SeriesProvider;
  /** Publisher series id (FRED id, Tesouro rule, or Yahoo symbol). */
  seriesId?: string;
  frequency?: "daily" | "monthly";
  sourceName?: string;
  /** How the print is dated / averaged (e.g. monthly average, morning sell yield). */
  asOfConvention?: string;
  /**
   * Honest copy when no public series can be fetched.
   * Used instead of a made-up chart. Live is not attempted when this is set and provider is omitted.
   */
  unavailableReason?: string;
};

export type LoadState<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "error"; message: string; data?: T }
  | { status: "unavailable"; message: string };
