import { useState } from "react";
import { ChartCard } from "../components/ChartCard";
import { MemorySection } from "../components/MemorySection";
import { AiEconomics } from "../components/AiEconomics";
import { SectionTitle } from "../components/SectionTitle";
import { TimeRangeControl } from "../components/TimeRangeControl";
import { energySoftSpecs, metalSpecs } from "../data/catalog";
import { useMarketSeries } from "../hooks/useMarketSeries";
import type { SeriesSpec, TimeRange } from "../types";

function SpecGrid({ specs, range }: { specs: SeriesSpec[]; range: TimeRange }) {
  return (
    <div className="grid">
      {specs.map((spec) => (
        <SpecCard key={spec.id} spec={spec} range={range} />
      ))}
    </div>
  );
}

function SpecCard({ spec, range }: { spec: SeriesSpec; range: TimeRange }) {
  const state = useMarketSeries(spec, range);
  return <ChartCard spec={spec} state={state} />;
}

export function CommoditiesPage() {
  const [range, setRange] = useState<TimeRange>("1Y");

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">Page 1</p>
          <h1>Commodities</h1>
          <p className="lede">
            Metals, energy and softs from Yahoo Finance futures, DRAM from TrendForce public snapshots, and a
            curated AI token / energy panel. Each chart loads independently.
          </p>
        </div>
        <TimeRangeControl value={range} onChange={setRange} />
      </div>

      <SectionTitle
        eyebrow="Metals"
        title="Precious and industrial metals"
        hint="COMEX / NYMEX continuous futures via Yahoo Finance."
      />
      <SpecGrid specs={metalSpecs} range={range} />

      <SectionTitle
        eyebrow="Energy & softs"
        title="Crude oil and cotton"
        hint="WTI crude (CL=F) and ICE cotton (CT=F)."
      />
      <SpecGrid specs={energySoftSpecs} range={range} />

      <SectionTitle
        eyebrow="Memory"
        title="DRAM / memory chip prices"
        hint="No free DRAM tick API — latest TrendForce public prints plus a clearly labeled illustrative path."
      />
      <MemorySection range={range} />

      <SectionTitle
        eyebrow="AI economics"
        title="Token cost and energy efficiency"
        hint={`OpenAI, Anthropic, Kimi, Grok (xAI), Gemini — token $ from official pages; energy metrics labeled published vs illustrative.`}
      />
      <AiEconomics />
    </div>
  );
}
