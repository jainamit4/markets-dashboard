import { useMarketSeries } from "../hooks/useMarketSeries";
import type { SeriesSpec, TimeRange } from "../types";
import { ChartCard } from "./ChartCard";

export function SeriesCard({ spec, range }: { spec: SeriesSpec; range: TimeRange }) {
  const state = useMarketSeries(spec, range);
  return <ChartCard spec={spec} state={state} />;
}

export function SpecGrid({ specs, range }: { specs: SeriesSpec[]; range: TimeRange }) {
  return (
    <div className="grid">
      {specs.map((spec) => (
        <SeriesCard key={spec.id} spec={spec} range={range} />
      ))}
    </div>
  );
}
