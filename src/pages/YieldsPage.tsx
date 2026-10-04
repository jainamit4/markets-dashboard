import { useState } from "react";
import { SectionTitle } from "../components/SectionTitle";
import { SpecGrid } from "../components/SeriesCard";
import { TimeRangeControl } from "../components/TimeRangeControl";
import { yieldSpecs } from "../data/catalog";
import type { TimeRange } from "../types";

export function YieldsPage() {
  const [range, setRange] = useState<TimeRange>("1Y");

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">Page 4</p>
          <h1>Bond yields</h1>
          <p className="lede">
            Ten-year sovereign yields for the same places as the currency desk. The euro is not a country —
            that card is the Germany 10-year Bund, the usual euro-area benchmark, if Yahoo will load it.
            Missing series stay unavailable rather than estimated.
          </p>
        </div>
        <TimeRangeControl value={range} onChange={setRange} />
      </div>

      <SectionTitle
        eyebrow="Sovereign yields"
        title="10-year government benchmarks"
        hint="Live path is the same Yahoo chart API. Country 10Y=RR tickers currently 404, so cards show an explicit unavailable state instead of a made-up chart."
      />
      <SpecGrid specs={yieldSpecs} range={range} />
    </div>
  );
}
