import { handleCorsPreamble, jsonResponse } from "./cors";

export const TESOURO_CSV_URL =
  "https://www.tesourotransparente.gov.br/ckan/dataset/df56aa42-484a-4a59-8184-7676580c81e3/resource/796d2059-14e9-44e3-80c9-2d9e30b405c1/download/precotaxatesourodireto.csv";

const NTN_F = "Tesouro Prefixado com Juros Semestrais";
const USER_AGENT =
  "Mozilla/5.0 (compatible; markets-dashboard/1.0; +https://github.com/jainamit4/markets-dashboard)";
const YEAR_MS = 365.25 * 86_400_000;
const KEEP_YEARS = 5;

export type OfficialPoint = { t: number; v: number; instrument?: string };

function parseBrDate(value: string): number | null {
  const parts = value.trim().split("/");
  if (parts.length !== 3) return null;
  const d = Number(parts[0]);
  const m = Number(parts[1]);
  const y = Number(parts[2]);
  if (!y || !m || !d) return null;
  return Date.UTC(y, m - 1, d);
}

function parseBrNumber(value: string): number | null {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  if (!normalized) return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

type Best = { abs: number; instrument: string; v: number };

/**
 * Official Tesouro Direto morning sell yields (Taxa Venda Manhã) for the NTN-F
 * (Prefixado com Juros Semestrais) whose remaining maturity is nearest 10 years.
 * Each point is a published print — no interpolation.
 */
export function selectNtnfNearest10y(rows: Array<{ tipo: string; venc: string; base: string; venda: string }>): OfficialPoint[] {
  const best = new Map<number, Best>();
  for (const row of rows) {
    if (row.tipo !== NTN_F) continue;
    const t = parseBrDate(row.base);
    const venc = parseBrDate(row.venc);
    const v = parseBrNumber(row.venda);
    if (t == null || venc == null || v == null || venc <= t) continue;
    const years = (venc - t) / YEAR_MS;
    const abs = Math.abs(years - 10);
    const prev = best.get(t);
    if (!prev || abs < prev.abs) {
      best.set(t, { abs, instrument: row.venc, v });
    }
  }
  return [...best.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([t, row]) => ({ t, v: row.v, instrument: row.instrument }));
}

export async function fetchTesouroNtnf10y(signal?: AbortSignal): Promise<OfficialPoint[]> {
  const res = await fetch(TESOURO_CSV_URL, {
    signal,
    headers: { "User-Agent": USER_AGENT, Accept: "text/csv,*/*" },
  });
  if (!res.ok || !res.body) {
    throw new Error(res.ok ? "Tesouro CSV had no body" : `${res.status} ${res.statusText}`);
  }

  const cutoff = Date.UTC(new Date().getUTCFullYear() - KEEP_YEARS, 0, 1);
  const decoder = new TextDecoder("utf-8");
  const reader = res.body.getReader();
  let buf = "";
  let headerDone = false;
  let tipoIdx = 0;
  let vencIdx = 1;
  let baseIdx = 2;
  let vendaIdx = 4;
  const rows: Array<{ tipo: string; venc: string; base: string; venda: string }> = [];
  let newestSeen: number | null = null;
  let reachedHistory = false;

  const consumeLine = (line: string): boolean => {
    if (!line) return true;
    if (!headerDone) {
      const header = line.replace(/^\uFEFF/, "").split(";");
      tipoIdx = header.findIndex((h) => /tipo/i.test(h));
      vencIdx = header.findIndex((h) => /venc/i.test(h));
      baseIdx = header.findIndex((h) => /data base/i.test(h));
      vendaIdx = header.findIndex((h) => /taxa venda/i.test(h));
      if (tipoIdx < 0 || vencIdx < 0 || baseIdx < 0 || vendaIdx < 0) {
        throw new Error("Tesouro CSV header missing expected columns");
      }
      headerDone = true;
      return true;
    }
    const cols = line.split(";");
    const tipo = cols[tipoIdx]?.trim() ?? "";
    const venc = cols[vencIdx]?.trim() ?? "";
    const base = cols[baseIdx]?.trim() ?? "";
    const venda = cols[vendaIdx]?.trim() ?? "";
    const t = parseBrDate(base);
    if (t != null) {
      if (newestSeen == null || t > newestSeen) newestSeen = t;
      if (t < cutoff && newestSeen != null && t < newestSeen) {
        reachedHistory = true;
        return false;
      }
    }
    if (tipo === NTN_F) {
      rows.push({ tipo, venc, base, venda });
    }
    return true;
  };

  try {
    while (!reachedHistory) {
      const { done, value } = await reader.read();
      if (done) {
        buf += decoder.decode();
        break;
      }
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split(/\r?\n/);
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!consumeLine(line)) {
          reachedHistory = true;
          break;
        }
      }
    }
    if (buf && !reachedHistory) consumeLine(buf);
  } finally {
    try {
      await reader.cancel();
    } catch {
      /* ignore */
    }
  }

  const points = selectNtnfNearest10y(rows);
  if (points.length < 1) {
    throw new Error("Tesouro NTN-F nearest-10y selection produced no official prints");
  }
  return points;
}

export async function proxyTesouroNtnf10y(request: Request): Promise<Response> {
  const pre = await handleCorsPreamble(request);
  if (pre instanceof Response) return pre;

  try {
    const observations = await fetchTesouroNtnf10y();
    const lastInstrument = observations[observations.length - 1]?.instrument;
    return jsonResponse(
      {
        provider: "tesouro",
        id: "NTNF-NEAREST-10Y",
        frequency: "daily",
        unit: "Percent",
        instrument: lastInstrument,
        observations,
      },
      200,
      pre.cors,
      "public, max-age=0, s-maxage=3600, stale-while-revalidate=7200",
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tesouro fetch failed";
    return jsonResponse({ error: message }, 502, pre.cors);
  }
}
