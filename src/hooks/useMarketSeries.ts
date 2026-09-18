import { useEffect, useState } from "react";
import { loadMarketSeries } from "../lib/marketData";
import type { LoadState, MarketSeries, SeriesSpec, TimeRange } from "../types";

export function useMarketSeries(spec: SeriesSpec, range: TimeRange): LoadState<MarketSeries> {
  const [state, setState] = useState<LoadState<MarketSeries>>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    loadMarketSeries(spec, range, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ status: "ready", data });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : "Failed to load series";
        setState({ status: "error", message });
      });
    return () => controller.abort();
  }, [spec, range]);

  return state;
}
