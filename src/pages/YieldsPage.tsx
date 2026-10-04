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
            Ten-year sovereign yields for the same places as the currency desk. Series come from FRED where it
            republishes the official OECD 10-year government yield, and from Tesouro Direto for Brazil. The
            euro card is Germany’s 10-year Bund. Iran and Argentina stay unavailable — no public series could
            be fetched. Monthly FRED prints are sparse on 1D/1W windows.
          </p>
        </div>
        <TimeRangeControl value={range} onChange={setRange} />
      </div>

      <SectionTitle
        eyebrow="Sovereign yields"
        title="10-year government benchmarks"
        hint="FRED IRLTLT01* / INDIRLTLT01STM (monthly average, % per annum) and Tesouro Direto NTN-F nearest 10-year remaining maturity (daily morning sell yield). Same proxy + labeled Sample fallback as the Yahoo pages."
      />
      <SpecGrid specs={yieldSpecs} range={range} />
    </div>
  );
}
