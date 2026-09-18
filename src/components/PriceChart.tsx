import {
  Area,
  Brush,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompact, formatTime } from "../lib/format";
import type { MarketSeries } from "../types";

type Props = {
  series: MarketSeries;
  height?: number;
  color?: string;
};

function ChartTooltip({
  active,
  payload,
  unit,
  interval,
}: {
  active?: boolean;
  payload?: Array<{ payload?: { t: number; v: number } }>;
  unit: string;
  interval?: string;
}) {
  const p = payload?.[0]?.payload;
  if (!active || !p) return null;
  return (
    <div className="tooltip">
      <div className="tooltip-time">{formatTime(p.t, interval)}</div>
      <div className="tooltip-val">
        {formatCompact(p.v)} <span>{unit}</span>
      </div>
    </div>
  );
}

export function PriceChart({ series, height = 248, color = "#d4a054" }: Props) {
  const up =
    series.points.length >= 2 &&
    series.points[series.points.length - 1].v >= series.points[0].v;
  const stroke = up ? color : "#ff6b7a";
  const fillId = `fill-${series.symbol.replace(/[^a-z0-9]/gi, "")}-${series.points.length}`;
  const showBrush = series.points.length > 40;

  return (
    <div className="chart-wrap" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={series.points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(140,160,180,0.12)" vertical={false} />
          <XAxis
            dataKey="t"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(t: number) => formatTime(t, series.interval)}
            tick={{ fill: "#8b9bb0", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={28}
          />
          <YAxis
            dataKey="v"
            domain={["auto", "auto"]}
            tickFormatter={(v: number) => formatCompact(v)}
            tick={{ fill: "#8b9bb0", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={64}
          />
          <Tooltip
            content={(props) => (
              <ChartTooltip {...props} unit={series.unit} interval={series.interval} />
            )}
            cursor={{ stroke: "rgba(232,237,244,0.2)" }}
          />
          <Area
            type="monotone"
            dataKey="v"
            stroke={stroke}
            fill={`url(#${fillId})`}
            strokeWidth={1.8}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: stroke }}
            isAnimationActive={false}
          />
          {showBrush ? (
            <Brush
              dataKey="t"
              height={20}
              stroke="#3a4a5c"
              fill="#121922"
              tickFormatter={(t: number) => formatTime(Number(t), series.interval)}
              travellerWidth={8}
            />
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
