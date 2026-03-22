"use strict";

const { buildIdeaSimulation, buildNewsSimulation } = require("./simulation");

const API_PROVIDER = (process.env.API_PROVIDER || "gemini").toLowerCase();
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const HF_MODEL = process.env.HF_MODEL || "Qwen/Qwen2.5-72B-Instruct";

function extractJson(text) {
  const cleaned = String(text || "").replace(/```json|```/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return JSON.");
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

function requestedLanguageName(language) {
  if (language === "hi") return "Hindi";
  if (language === "es") return "Spanish";
  return "English";
}

async function geminiChat(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY.");
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json"
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are a precise fintech simulation engine. Return valid JSON only.\n\n${prompt}`
            }
          ]
        }
      ]
    })
  });

  const raw = await response.text();
  let data = null;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch (_error) {
    throw new Error(`Gemini returned non-JSON output: ${raw.slice(0, 180)}`);
  }

  if (!response.ok) {
    const message = data && data.error && data.error.message ? data.error.message : `Gemini request failed with status ${response.status}.`;
    throw new Error(message);
  }

  const content =
    data &&
    data.candidates &&
    data.candidates[0] &&
    data.candidates[0].content &&
    Array.isArray(data.candidates[0].content.parts) &&
    data.candidates[0].content.parts[0]
      ? data.candidates[0].content.parts[0].text
      : "";

  return extractJson(content);
}

async function huggingFaceChat(prompt) {
  const apiKey = process.env.HF_TOKEN;
  if (!apiKey) {
    throw new Error("Missing HF_TOKEN.");
  }

  const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: HF_MODEL,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a precise fintech simulation engine. Return valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  const raw = await response.text();
  let data = null;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch (_error) {
    throw new Error(`Hugging Face returned non-JSON output: ${raw.slice(0, 180)}`);
  }

  if (!response.ok) {
    const message = data && data.error ? (typeof data.error === "string" ? data.error : data.error.message) : `Hugging Face request failed with status ${response.status}.`;
    throw new Error(message);
  }

  const content = data && data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : "";
  return extractJson(content);
}

async function providerChat(prompt) {
  if (API_PROVIDER === "huggingface" || API_PROVIDER === "hf") {
    return huggingFaceChat(prompt);
  }
  return geminiChat(prompt);
}

function normalizeIdeaPayload(parsed, fallback) {
  const metrics = parsed.metrics || {};
  const projections = parsed.projections || {};
  return {
    language: parsed.language || fallback.language,
    keywords: Array.isArray(parsed.keywords) && parsed.keywords.length ? parsed.keywords.slice(0, 6) : fallback.keywords,
    metrics: {
      riskLevel: metrics.riskLevel || fallback.metrics.riskLevel,
      marketFit: metrics.marketFit || fallback.metrics.marketFit
    },
    summary: parsed.summary || fallback.summary,
    roadmap: Array.isArray(parsed.roadmap) && parsed.roadmap.length ? parsed.roadmap.slice(0, 3).map((item, index) => ({
      phase: item.phase || fallback.roadmap[index].phase,
      detail: item.detail || fallback.roadmap[index].detail,
      tone: ["urgent", "warning", "upcoming"].includes(item.tone) ? item.tone : fallback.roadmap[index].tone
    })) : fallback.roadmap,
    projections: {
      labels: Array.isArray(projections.labels) && projections.labels.length === 6 ? projections.labels : fallback.projections.labels,
      values: Array.isArray(projections.values) && projections.values.length === 6 ? projections.values.map((value, index) => Number(value) || fallback.projections.values[index]) : fallback.projections.values
    },
    actions: Array.isArray(parsed.actions) && parsed.actions.length ? parsed.actions.slice(0, 3) : fallback.actions
  };
}

function normalizeNewsPayload(parsed, fallback) {
  const futurePrediction = parsed.futurePrediction || {};
  const chart = parsed.chart || {};
  return {
    language: parsed.language || fallback.language,
    themes: Array.isArray(parsed.themes) && parsed.themes.length ? parsed.themes.slice(0, 5) : fallback.themes,
    marketImpact: Array.isArray(parsed.marketImpact) && parsed.marketImpact.length ? parsed.marketImpact.slice(0, 4).map((item, index) => ({
      label: item.label || fallback.marketImpact[index].label,
      value: item.value || fallback.marketImpact[index].value,
      tone: ["badge-green", "badge-red", "badge-yellow"].includes(item.tone) ? item.tone : fallback.marketImpact[index].tone
    })) : fallback.marketImpact,
    globalEffect: parsed.globalEffect || fallback.globalEffect,
    futurePrediction: {
      shortTerm: futurePrediction.shortTerm || fallback.futurePrediction.shortTerm,
      longTerm: futurePrediction.longTerm || fallback.futurePrediction.longTerm
    },
    narrativeInsight: parsed.narrativeInsight || fallback.narrativeInsight,
    sectors: Array.isArray(parsed.sectors) && parsed.sectors.length ? parsed.sectors.slice(0, 4).map((item, index) => ({
      name: item.name || fallback.sectors[index].name,
      outlook: item.outlook || fallback.sectors[index].outlook,
      icon: item.icon || fallback.sectors[index].icon,
      color: item.color || fallback.sectors[index].color
    })) : fallback.sectors,
    chart: {
      labels: Array.isArray(chart.labels) && chart.labels.length === 6 ? chart.labels : fallback.chart.labels,
      datasets: Array.isArray(chart.datasets) && chart.datasets.length ? chart.datasets.slice(0, 3).map((item, index) => ({
        label: item.label || fallback.chart.datasets[index].label,
        values: Array.isArray(item.values) && item.values.length === 6 ? item.values.map((value, innerIndex) => Number(value) || fallback.chart.datasets[index].values[innerIndex]) : fallback.chart.datasets[index].values,
        borderColor: item.borderColor || fallback.chart.datasets[index].borderColor,
        borderDash: Array.isArray(item.borderDash) ? item.borderDash : fallback.chart.datasets[index].borderDash
      })) : fallback.chart.datasets
    }
  };
}

async function generateIdeaSimulation(options) {
  const fallback = buildIdeaSimulation(options.idea, options.acceptLanguage, options.language);
  const languageName = requestedLanguageName(fallback.language);

  const prompt = `
Generate a startup strategy simulation in ${languageName}.

Startup idea:
${options.idea}

Return strict JSON with this exact shape:
{
  "language": "${fallback.language}",
  "keywords": ["k1", "k2", "k3", "k4", "k5", "k6"],
  "metrics": {
    "riskLevel": "string",
    "marketFit": "string"
  },
  "summary": "string",
  "roadmap": [
    { "phase": "string", "detail": "string", "tone": "urgent" },
    { "phase": "string", "detail": "string", "tone": "warning" },
    { "phase": "string", "detail": "string", "tone": "upcoming" }
  ],
  "projections": {
    "labels": ["l1", "l2", "l3", "l4", "l5", "l6"],
    "values": [1000, 2000, 3000, 4000, 5000, 6000]
  },
  "actions": ["a1", "a2", "a3"]
}

Rules:
- Keep all text in ${languageName}.
- Make the output practical for a fintech founder.
- Keep keywords short.
- Return JSON only.
`.trim();

  try {
    const parsed = await providerChat(prompt);
    return normalizeIdeaPayload(parsed, fallback);
  } catch (_error) {
    return fallback;
  }
}

async function generateNewsSimulation(options) {
  const fallback = buildNewsSimulation(options.text, options.acceptLanguage, options.sourceType, options.language);
  const languageName = requestedLanguageName(fallback.language);

  const prompt = `
Generate a market impact simulation in ${languageName}.

Source type: ${options.sourceType}
Input:
${options.text}

Return strict JSON with this exact shape:
{
  "language": "${fallback.language}",
  "themes": ["t1", "t2", "t3", "t4", "t5"],
  "marketImpact": [
    { "label": "string", "value": "string", "tone": "badge-green" },
    { "label": "string", "value": "string", "tone": "badge-red" },
    { "label": "string", "value": "string", "tone": "badge-yellow" },
    { "label": "string", "value": "string", "tone": "badge-green" }
  ],
  "globalEffect": "string",
  "futurePrediction": {
    "shortTerm": "string",
    "longTerm": "string"
  },
  "narrativeInsight": "string",
  "sectors": [
    { "name": "string", "outlook": "string", "icon": "fa-solid fa-microchip", "color": "green" },
    { "name": "string", "outlook": "string", "icon": "fa-solid fa-building-columns", "color": "yellow" },
    { "name": "string", "outlook": "string", "icon": "fa-solid fa-bolt", "color": "red" },
    { "name": "string", "outlook": "string", "icon": "fa-solid fa-truck-fast", "color": "yellow" }
  ],
  "chart": {
    "labels": ["Now", "4h", "24h", "3d", "1w", "1m"],
    "datasets": [
      { "label": "Optimistic", "values": [100, 103, 108, 114, 121, 129], "borderColor": "#10b981", "borderDash": [] },
      { "label": "Baseline", "values": [100, 101, 103, 106, 109, 113], "borderColor": "#3b82f6", "borderDash": [] },
      { "label": "Stressed", "values": [100, 98, 95, 91, 88, 84], "borderColor": "#ef4444", "borderDash": [6, 5] }
    ]
  }
}

Rules:
- Keep all text in ${languageName}.
- Focus on business and market implications.
- Keep values concise and UI-friendly.
- Return JSON only.
`.trim();

  try {
    const parsed = await providerChat(prompt);
    return normalizeNewsPayload(parsed, fallback);
  } catch (_error) {
    return fallback;
  }
}

module.exports = {
  generateIdeaSimulation,
  generateNewsSimulation
};
