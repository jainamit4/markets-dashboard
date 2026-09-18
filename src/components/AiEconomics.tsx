import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AI_PRICING_AS_OF,
  aiLabs,
  apiUsdPerKwh,
  centsPerWattHour,
  tokensPerKwh,
  type AiLab,
} from "../data/aiPricing";
import { formatUsd } from "../lib/format";

function MoneyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tooltip">
      <div className="tooltip-time">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="tooltip-val" style={{ color: p.color }}>
          {p.name}: {formatUsd(Number(p.value))}
        </div>
      ))}
    </div>
  );
}

function EnergyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tooltip">
      <div className="tooltip-time">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="tooltip-val" style={{ color: p.color }}>
          {p.name}: {formatUsd(Number(p.value))} / kWh
        </div>
      ))}
    </div>
  );
}

function LabCard({ lab }: { lab: AiLab }) {
  const kwh = apiUsdPerKwh(lab);
  const tpk = tokensPerKwh(lab);
  const cpw = centsPerWattHour(lab);
  return (
    <article className="ai-lab">
      <header>
        <div className="ai-lab-name">{lab.lab}</div>
        <div className="ai-lab-model">{lab.model}</div>
      </header>
      <dl className="ai-dl">
        <div>
          <dt>Input / 1M</dt>
          <dd>{formatUsd(lab.inputUsdPerMillion)}</dd>
        </div>
        <div>
          <dt>Output / 1M</dt>
          <dd>{formatUsd(lab.outputUsdPerMillion)}</dd>
        </div>
        <div>
          <dt>Est. API $ / kWh</dt>
          <dd>
            {formatUsd(kwh)}
            <span className={lab.energy.kind === "published" ? "tag pub" : "tag est"}>
              {lab.energy.kind === "published" ? "prompt published" : "illustrative"}
            </span>
          </dd>
        </div>
        <div>
          <dt>Est. ¢ / Wh</dt>
          <dd>{cpw.toFixed(2)}¢</dd>
        </div>
        <div>
          <dt>Est. tokens / kWh</dt>
          <dd>{Math.round(tpk).toLocaleString("en-US")}</dd>
        </div>
        {lab.energy.promptWh != null ? (
          <div>
            <dt>{lab.energy.kind === "published" ? "Wh / median prompt" : "Est. Wh / prompt"}</dt>
            <dd>{lab.energy.promptWh.toFixed(2)}</dd>
          </div>
        ) : null}
      </dl>
      <p className="card-note">
        {lab.contextNote}. Token prices:{" "}
        <a href={lab.pricingUrl} target="_blank" rel="noreferrer">
          official pricing
        </a>
        . {lab.energy.energyNote} {lab.energy.promptWhNote}
      </p>
    </article>
  );
}

export function AiEconomics() {
  const tokenRows = aiLabs.map((lab) => ({
    name: lab.lab,
    input: lab.inputUsdPerMillion,
    output: lab.outputUsdPerMillion,
  }));
  const energyRows = aiLabs.map((lab) => ({
    name: lab.lab,
    usdPerKwh: Number(apiUsdPerKwh(lab).toFixed(2)),
  }));

  return (
    <section className="ai-panel">
      <div className="ai-charts">
        <article className="card">
          <header className="card-head">
            <div>
              <h3>Token cost · USD / 1M tokens</h3>
              <p className="card-sub">Representative current models · as of {AI_PRICING_AS_OF}</p>
            </div>
            <span className="badge">Curated</span>
          </header>
          <div className="chart-wrap" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tokenRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(140,160,180,0.12)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#8b9bb0", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: "#8b9bb0", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${v}`}
                />
                <Tooltip content={MoneyTooltip} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Legend wrapperStyle={{ color: "#8b9bb0", fontSize: 12 }} />
                <Bar dataKey="input" name="Input" fill="#4ecdc4" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="output" name="Output" fill="#d4a054" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="card">
          <header className="card-head">
            <div>
              <h3>Cost per watt · est. API $ / kWh</h3>
              <p className="card-sub">
                Blend of in/out token $ divided by estimated kWh per 1M tokens. Not a live market print.
              </p>
            </div>
            <span className="badge badge-sample">Illustrative</span>
          </header>
          <div className="chart-wrap" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={energyRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(140,160,180,0.12)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#8b9bb0", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: "#8b9bb0", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${v}`}
                />
                <Tooltip content={EnergyTooltip} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar
                  dataKey="usdPerKwh"
                  name="Est. API $ / kWh"
                  fill="#8b7cff"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="card-note">
            Google’s 0.24 Wh / median Gemini Apps prompt (May 2025) is a published production measurement;
            per-token conversion and all other labs are labeled illustrative. Sources linked on each card.
          </p>
        </article>
      </div>
      <div className="ai-labs">
        {aiLabs.map((lab) => (
          <LabCard key={lab.id} lab={lab} />
        ))}
      </div>
    </section>
  );
}
