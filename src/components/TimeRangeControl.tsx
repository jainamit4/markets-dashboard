import type { TimeRange } from "../types";
import { TIME_RANGES } from "../lib/ranges";

type Props = {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
};

export function TimeRangeControl({ value, onChange }: Props) {
  return (
    <div className="range" role="group" aria-label="Time range">
      {TIME_RANGES.map((range) => (
        <button
          key={range}
          type="button"
          className={range === value ? "range-btn active" : "range-btn"}
          onClick={() => onChange(range)}
          aria-pressed={range === value}
        >
          {range}
        </button>
      ))}
    </div>
  );
}
