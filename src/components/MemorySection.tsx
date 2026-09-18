import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DRAM_AS_OF,
  DRAM_SOURCE_LABEL,
  DRAM_SOURCE_URL,
  dramIllustrativeSeries,
  dramSpotSnapshot,
} from "../data/dram";
import { formatCompact, formatPct, formatPrice } from "../lib/format";
import { filterPointsByRange, windowChange } from "../lib/ranges";
import { PriceChart } from "./PriceChart";
import type { TimeRange } from "../types";

type Props = {
  range: TimeRange;
};

export function MemorySection({ range }: Props) {
  const points = filterPointsByRange(dramIllustrativeSeries, range);
  const last = points[points.length - 1]?.v ?? dramSpotSnapshot[0].usd;
  const change = windowChange(points);
  const series = {
    symbol: "DRAM-DDR5",
    title: "DDR5 16Gb spot",
    unit: "USD",
    points: points.length >= 2 ? points : dramIllustrativeSeries,
    last,
    source: "sample" as const,
    sourceLabel: `${DRAM_SOURCE_LABEL} · illustrative monthly path`,
    fetchedAt: DRAM_AS_OF,
    interval: "1d" as const,
  };

  return (
    <div className="memory-grid">
      <article className="card accent-teal">
        <header className="card-head">
          <div>
            <h3>Memory — DDR5 16Gb (2Gx8) 4800/5600</h3>
            <p className="card-sub">Spot / contract complex · USD per chip</p>
          </div>
          <span className="badge badge-sample">Illustrative + snapshot</span>
        </header>
        <div className="card-metrics">
          <div className="last">{formatPrice(last, "USD")}</div>
          {change ? (
            <div className={change.pct >= 0 ? "chg up" : "chg down"}>
              {formatPct(change.pct)} <span className="chg-win">range</span>
            </div>
          ) : null}
        </div>
        <PriceChart series={series} color="#4ecdc4" />
        <p className="card-note">
          Latest point aligned to{" "}
          <a href={DRAM_SOURCE_URL} target="_blank" rel="noreferrer">
            {DRAM_SOURCE_LABEL}
          </a>{" "}
          session average as of {DRAM_AS_OF} (${dramSpotSnapshot[0].usd}). Intermediate months are a labeled
          demo reconstruction of the 2024–2026 DRAM squeeze — not a live DRAM Exchange feed. There is no free
          public DRAM tick API comparable to Yahoo futures.
        </p>
      </article>
      <article className="card">
        <header className="card-head">
          <div>
            <h3>TrendForce public DRAM / GDDR snapshot</h3>
            <p className="card-sub">Session averages as of {DRAM_AS_OF}</p>
          </div>
          <span className="badge">Public page</span>
        </header>
        <div className="chart-wrap" style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dramSpotSnapshot}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid stroke="rgba(140,160,180,0.12)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: "#8b9bb0", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `$${formatCompact(v)}`}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={148}
                tick={{ fill: "#c5d0dc", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const row = payload[0].payload as (typeof dramSpotSnapshot)[number];
                  return (
                    <div className="tooltip">
                      <div className="tooltip-time">{row.name}</div>
                      <div className="tooltip-val">${row.usd.toFixed(3)}</div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="usd" name="USD" fill="#4ecdc4" radius={[0, 4, 4, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="card-note">
          Copied from the public TrendForce DRAM spot table ({DRAM_AS_OF}). Refresh by editing{" "}
          <code>src/data/dram.ts</code>. Source:{" "}
          <a href={DRAM_SOURCE_URL} target="_blank" rel="noreferrer">
            trendforce.com/price/dram
          </a>
          .
        </p>
      </article>
    </div>
  );
}
