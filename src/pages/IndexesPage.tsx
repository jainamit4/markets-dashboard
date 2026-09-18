import { useState } from "react";
import { ChartCard } from "../components/ChartCard";
import { SectionTitle } from "../components/SectionTitle";
import { TimeRangeControl } from "../components/TimeRangeControl";
import { indexSpecs } from "../data/catalog";
import { useMarketSeries } from "../hooks/useMarketSeries";
import type { TimeRange } from "../types";

export function IndexesPage() {
  const [range, setRange] = useState<TimeRange>("1Y");

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">Page 2</p>
          <h1>Country indexes</h1>
          <p className="lede">
            Key equity benchmarks for India, South Korea, Brazil, Chile, China, Indonesia, and Japan. Chile
            uses IPSA’s last print plus iShares MSCI Chile (ECH) history because Yahoo does not publish IPSA
            OHLC.
          </p>
        </div>
        <TimeRangeControl value={range} onChange={setRange} />
      </div>

      <SectionTitle
        eyebrow="Equities"
        title="National benchmarks"
        hint="Yahoo Finance index tickers. Shanghai Composite (000001.SS) is the China series on this desk."
      />
      <div className="grid">
        {indexSpecs.map((spec) => (
          <IndexCard key={spec.id} spec={spec} range={range} />
        ))}
      </div>
    </div>
  );
}

function IndexCard({
  spec,
  range,
}: {
  spec: (typeof indexSpecs)[number];
  range: TimeRange;
}) {
  const state = useMarketSeries(spec, range);
  return <ChartCard spec={spec} state={state} />;
}
