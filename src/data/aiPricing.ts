export type AiLab = {
  id: string;
  lab: string;
  model: string;
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
  cachedInputUsdPerMillion?: number;
  contextNote?: string;
  pricingUrl: string;
  energy: {
    kind: "published" | "illustrative";
    promptWh?: number;
    promptWhNote?: string;
    /** Estimated watt-hours per 1 million tokens. */
    whPerMillionTokens: number;
    energyNote: string;
    energySources: { label: string; url: string }[];
  };
};

export const AI_PRICING_AS_OF = "2026-09-18";

export const aiLabs: AiLab[] = [
  {
    id: "openai",
    lab: "OpenAI",
    model: "GPT-5.6 Sol",
    inputUsdPerMillion: 4,
    outputUsdPerMillion: 20,
    cachedInputUsdPerMillion: 0.4,
    contextNote: "Short-context standard tier",
    pricingUrl: "https://developers.openai.com/api/docs/pricing",
    energy: {
      kind: "illustrative",
      promptWh: 0.45,
      promptWhNote:
        "Scaled from Epoch AI’s ~0.3 Wh typical ChatGPT (GPT-4o) query estimate; not a vendor-published Sol figure.",
      whPerMillionTokens: 900,
      energyNote:
        "Assumes ~500 tokens per typical query to convert prompt-energy estimates into Wh / 1M tokens. Illustrative only.",
      energySources: [
        {
          label: "Epoch AI estimate cited in Google serving paper",
          url: "https://arxiv.org/abs/2508.15734",
        },
      ],
    },
  },
  {
    id: "anthropic",
    lab: "Anthropic",
    model: "Claude Sonnet 5",
    inputUsdPerMillion: 2,
    outputUsdPerMillion: 10,
    cachedInputUsdPerMillion: 0.2,
    contextNote: "Standard API · $2 / $10 made permanent",
    pricingUrl: "https://docs.anthropic.com/en/docs/about-claude/pricing",
    energy: {
      kind: "illustrative",
      promptWh: 0.4,
      promptWhNote: "No public production Wh/prompt from Anthropic. Illustrative mid-tier serving estimate.",
      whPerMillionTokens: 800,
      energyNote:
        "Derived from ~0.40 Wh/query × ~500 tokens/query. Not measured on Claude production traffic.",
      energySources: [
        {
          label: "Method overlay vs Google / Epoch public estimates",
          url: "https://arxiv.org/abs/2508.15734",
        },
      ],
    },
  },
  {
    id: "kimi",
    lab: "Kimi (Moonshot)",
    model: "Kimi K3",
    inputUsdPerMillion: 3,
    outputUsdPerMillion: 15,
    cachedInputUsdPerMillion: 0.3,
    contextNote: "Flat 1M-context pricing · cache-miss input",
    pricingUrl: "https://platform.kimi.ai/docs/pricing/chat-k3",
    energy: {
      kind: "illustrative",
      promptWh: 0.4,
      promptWhNote: "No public Kimi serving-energy disclosure. Illustrative only.",
      whPerMillionTokens: 800,
      energyNote:
        "Same conversion as other non-Google labs (~500 tokens/query). Not a measured K3 figure.",
      energySources: [
        {
          label: "Public inference-energy literature (Google / Epoch)",
          url: "https://arxiv.org/abs/2508.15734",
        },
      ],
    },
  },
  {
    id: "grok",
    lab: "Grok (xAI)",
    model: "Grok 4.6",
    inputUsdPerMillion: 2,
    outputUsdPerMillion: 6,
    cachedInputUsdPerMillion: 0.5,
    contextNote: "Prompts < 200k tokens",
    pricingUrl: "https://docs.x.ai/developers/pricing",
    energy: {
      kind: "illustrative",
      promptWh: 0.35,
      promptWhNote: "No public xAI Wh/prompt. Illustrative estimate between Epoch ChatGPT and Gemini Apps.",
      whPerMillionTokens: 700,
      energyNote:
        "Assumes ~500 tokens/query. Not measured on Grok production traffic.",
      energySources: [
        {
          label: "Public inference-energy literature (Google / Epoch)",
          url: "https://arxiv.org/abs/2508.15734",
        },
      ],
    },
  },
  {
    id: "gemini",
    lab: "Gemini (Google)",
    model: "Gemini 3.1 Pro",
    inputUsdPerMillion: 2,
    outputUsdPerMillion: 12,
    cachedInputUsdPerMillion: 0.2,
    contextNote: "Standard paid · prompts ≤ 200k tokens",
    pricingUrl: "https://ai.google.dev/gemini-api/docs/pricing",
    energy: {
      kind: "published",
      promptWh: 0.24,
      promptWhNote:
        "Published median Gemini Apps text prompt, May 2025 — not the Gemini 3.1 Pro API specifically.",
      whPerMillionTokens: 480,
      energyNote:
        "0.24 Wh/prompt is Google’s production measurement (full serving stack). Wh / 1M tokens uses an illustrative 500-token median prompt to make labs comparable.",
      energySources: [
        {
          label: "Google: Measuring AI serving at production scale (arXiv:2508.15734)",
          url: "https://arxiv.org/abs/2508.15734",
        },
      ],
    },
  },
];

export function blendUsdPerMillion(lab: AiLab): number {
  return (lab.inputUsdPerMillion + lab.outputUsdPerMillion) / 2;
}

/** API dollars billed per kWh of estimated inference energy (blend in/out). */
export function apiUsdPerKwh(lab: AiLab): number {
  const kwh = lab.energy.whPerMillionTokens / 1000;
  return blendUsdPerMillion(lab) / kwh;
}

export function tokensPerKwh(lab: AiLab): number {
  return 1_000_000 / (lab.energy.whPerMillionTokens / 1000);
}

/** Cents of API blend cost per watt-hour. */
export function centsPerWattHour(lab: AiLab): number {
  return (blendUsdPerMillion(lab) / lab.energy.whPerMillionTokens) * 100;
}
