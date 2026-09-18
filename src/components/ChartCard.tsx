import { PriceChart } from "./PriceChart";
import { formatPct, formatPrice } from "../lib/format";
import { windowChange } from "../lib/ranges";
import type { LoadState, MarketSeries, SeriesSpec } from "../types";

const ACCENT: Record<SeriesSpec["accent"], string> = {
  gold: "#d4a054",
  teal: "#4ecdc4",
  copper: "#e07a3d",
  silver: "#c5d0dc",
};

type Props = {
  spec: SeriesSpec;
  state: LoadState<MarketSeries>;
};

export function ChartCard({ spec, state }: Props) {
  const color = ACCENT[spec.accent];

  if (state.status === "loading") {
    return (
      <article className={`card accent-${spec.accent}`}>
        <header className="card-head">
          <div>
            <h3>{spec.title}</h3>
            <p className="card-sub">{spec.subtitle}</p>
          </div>
          <span className="badge">Loading</span>
        </header>
        <div className="skeleton" />
      </article>
    );
  }

  if (state.status === "error") {
    return (
      <article className={`card accent-${spec.accent}`}>
        <header className="card-head">
          <div>
            <h3>{spec.title}</h3>
            <p className="card-sub">{spec.subtitle}</p>
          </div>
          <span className="badge badge-err">Error</span>
        </header>
        <p className="error-copy">Could not load {spec.symbol}: {state.message}</p>
      </article>
    );
  }

  const series = state.data;
  const last = series.last ?? series.points[series.points.length - 1]?.v;
  const change = windowChange(series.points);
  const up = (change?.pct ?? 0) >= 0;

  return (
    <article className={`card accent-${spec.accent}`}>
      <header className="card-head">
        <div>
          <h3>{spec.title}</h3>
          <p className="card-sub">{spec.subtitle}</p>
        </div>
        <span className={series.source === "live" ? "badge badge-live" : "badge badge-sample"}>
          {series.source === "live" ? "Live" : "Sample"}
        </span>
      </header>
      <div className="card-metrics">
        <div className="last">{last != null ? formatPrice(last, series.unit) : "—"}</div>
        {change ? (
          <div className={up ? "chg up" : "chg down"}>
            {formatPct(change.pct)} <span className="chg-win">range</span>
          </div>
        ) : null}
      </div>
      {series.quotePrint ? (
        <div className="quote-print">
          {series.quotePrint.label}: {formatPrice(series.quotePrint.last, series.quotePrint.currency)}
        </div>
      ) : null}
      {series.points.length >= 2 ? (
        <PriceChart series={series} color={color} />
      ) : (
        <p className="error-copy">
          Only a last print is available for this range ({last != null ? formatPrice(last, series.unit) : "n/a"}
          ). Try a longer window.
        </p>
      )}
      <p className="card-note">
        {series.sourceLabel}
        {series.note ? ` · ${series.note}` : ""}
      </p>
    </article>
  );
}
