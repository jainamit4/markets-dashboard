const nfCache = new Map<string, Intl.NumberFormat>();

function nf(options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = JSON.stringify(options);
  let fmt = nfCache.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat("en-US", options);
    nfCache.set(key, fmt);
  }
  return fmt;
}

export function formatPrice(value: number, unit?: string): string {
  const abs = Math.abs(value);
  const digits =
    abs >= 1000 ? 2 : abs >= 100 ? 2 : abs >= 10 ? 2 : abs >= 1 ? 3 : 4;
  const body = nf({
    minimumFractionDigits: abs >= 1000 ? 0 : Math.min(digits, 2),
    maximumFractionDigits: abs >= 1000 ? 2 : digits,
  }).format(value);
  if (!unit) return body;
  if (unit.startsWith("USD") || unit.startsWith("¢")) return `${body} ${unit}`;
  return `${body} ${unit}`;
}

export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1000) {
    return nf({ maximumFractionDigits: 2 }).format(value);
  }
  if (abs >= 1) return nf({ minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  return nf({ minimumFractionDigits: 3, maximumFractionDigits: 4 }).format(value);
}

export function formatPct(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatSigned(value: number, digits = 2): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}`;
}

export function formatTime(ts: number, interval?: string): string {
  const d = new Date(ts);
  const intraday = interval === "5m" || interval === "15m" || interval === "1m" || interval === "1h";
  if (intraday) {
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function formatUsd(value: number, digits = 2): string {
  return nf({
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}
