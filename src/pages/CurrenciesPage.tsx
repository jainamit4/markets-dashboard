import { useState } from "react";
import { SectionTitle } from "../components/SectionTitle";
import { SpecGrid } from "../components/SeriesCard";
import { TimeRangeControl } from "../components/TimeRangeControl";
import { currencySpecs } from "../data/catalog";
import type { TimeRange } from "../types";

export function CurrenciesPage() {
  const [range, setRange] = useState<TimeRange>("1Y");

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">Page 3</p>
          <h1>Currencies</h1>
          <p className="lede">
            Each series is that currency against the US dollar, quoted as units of the named currency per 1
            US dollar (Yahoo USD/XXX pairs). Mexican peso is its own card, separate from Argentina and
            Brazil. Charts load independently.
          </p>
        </div>
        <TimeRangeControl value={range} onChange={setRange} />
      </div>

      <SectionTitle
        eyebrow="FX vs USD"
        title="Units of each currency per 1 US dollar"
        hint="Yahoo Finance JPY=X, MXN=X, AUD=X, INR=X, GBP=X, EUR=X, IRR=X, ARS=X, BRL=X. These are not USD-per-foreign-unit majors (AUDUSD / GBPUSD / EURUSD)."
      />
      <SpecGrid specs={currencySpecs} range={range} />
    </div>
  );
}
