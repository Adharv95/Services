"use strict";

const STOPWORDS = new Set([
  "the", "and", "for", "with", "from", "that", "this", "into", "your", "about", "have",
  "will", "would", "should", "could", "their", "there", "then", "than", "what", "when",
  "where", "which", "while", "using", "across", "after", "before", "under", "between",
  "startup", "idea", "news", "article", "event", "market", "company", "business", "plan",
  "platform", "product", "service", "more", "less", "very", "over", "also", "into", "paste",
  "para", "como", "pero", "avec", "pour", "dans", "eine", "und", "der", "die", "das",
  "que", "una", "para", "por", "los", "las", "des", "les", "sur", "noticia", "startup"
  , "de", "con", "del", "las", "los", "una", "uno", "para", "sobre"
]);

const LANGUAGE_PACKS = {
  en: {
    riskLabels: { High: "High", Medium: "Medium", Low: "Low" },
    fitLabels: { Strong: "Strong", Moderate: "Moderate", Weak: "Weak" },
    monthLabels: ["Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6"],
    ideaSummary: ({ sector, riskLevel, marketFit }) => `This concept is strongest in ${sector} and shows ${marketFit.toLowerCase()} market-fit signals, but execution discipline is needed to keep ${riskLevel.toLowerCase()} risk under control.`,
    ideaActions: [
      "Validate demand with ten to fifteen target customers before expanding scope.",
      "Turn the first release into a narrow MVP with one measurable success metric.",
      "Map compliance, pricing, and go-to-market owners before hiring aggressively."
    ],
    roadmapLabels: ["Immediate validation", "Execution buildout", "Scale decision"],
    roadmapDetails: [
      "Pressure-test the customer problem, willingness to pay, and onboarding friction with live interviews and a quick landing page.",
      "Build the smallest usable workflow, set baseline unit economics, and prepare compliance and operations checklists.",
      "Expand channels only after retention, conversion, and support load stay inside the target range."
    ],
    newsGlobal: ({ sector, emotion }) => `The event is likely to create a ${emotion.toLowerCase()} global read-through, with the clearest spillover landing in ${sector.toLowerCase()} and adjacent risk assets.`,
    newsNarrative: ({ sourceType }) => `The market is likely to trade the headline first and the fundamentals second. ${sourceType === "url" ? "Because this came from a linked article, the extraction layer prioritizes the headline and body text over page chrome." : "Because this came from pasted text, the scenario leans on the exact wording and urgency cues in the submission."}`,
    shortTerm: { positive: "Constructive", negative: "Volatile", neutral: "Mixed" },
    longTerm: { positive: "Bullish bias", negative: "Selective recovery", neutral: "Range-bound" },
    impactLabels: ["Equities", "Crypto", "FX", "Rates"],
    sectorNames: ["Tech", "Finance", "Energy", "Logistics"]
  },
  hi: {
    riskLabels: { High: "उच्च", Medium: "मध्यम", Low: "कम" },
    fitLabels: { Strong: "मजबूत", Moderate: "मध्यम", Weak: "कमजोर" },
    monthLabels: ["माह 1", "माह 2", "माह 3", "माह 4", "माह 5", "माह 6"],
    ideaSummary: ({ sector, riskLevel, marketFit }) => `यह विचार ${sector} क्षेत्र में सबसे मजबूत दिखता है और ${marketFit.toLowerCase()} मार्केट-फिट संकेत देता है, लेकिन ${riskLevel.toLowerCase()} जोखिम को संभालने के लिए अनुशासित क्रियान्वयन जरूरी है।`,
    ideaActions: [
      "स्कोप बढ़ाने से पहले 10 से 15 लक्षित ग्राहकों के साथ मांग की पुष्टि करें।",
      "पहले संस्करण को एक संकीर्ण MVP रखें और एक स्पष्ट सफलता मेट्रिक तय करें।",
      "तेजी से भर्ती से पहले compliance, pricing और go-to-market जिम्मेदारियां तय करें।"
    ],
    roadmapLabels: ["तुरंत सत्यापन", "निर्माण चरण", "स्केल निर्णय"],
    roadmapDetails: [
      "लाइव इंटरव्यू और एक तेज landing page के जरिए ग्राहक समस्या, भुगतान की इच्छा और onboarding friction जांचें।",
      "सबसे छोटा उपयोगी workflow बनाएं, unit economics baseline सेट करें और compliance तथा operations checklist तैयार करें।",
      "Retention, conversion और support load लक्ष्य सीमा में रहने पर ही channels विस्तार करें।"
    ],
    newsGlobal: ({ sector, emotion }) => `इस घटना से ${emotion.toLowerCase()} वैश्विक प्रभाव बन सकता है, जिसका सबसे स्पष्ट असर ${sector.toLowerCase()} और उससे जुड़े risk assets पर दिखेगा।`,
    newsNarrative: ({ sourceType }) => `मार्केट पहले headline पर और बाद में fundamentals पर प्रतिक्रिया देगा। ${sourceType === "url" ? "क्योंकि इनपुट एक article URL से आया है, extraction layer ने headline और body text को प्राथमिकता दी है।" : "क्योंकि इनपुट pasted text है, scenario उसी भाषा और urgency signals पर आधारित है जो सबमिशन में मौजूद हैं।"}`,
    shortTerm: { positive: "सकारात्मक", negative: "उथल-पुथल", neutral: "मिश्रित" },
    longTerm: { positive: "तेजी की संभावना", negative: "चयनात्मक सुधार", neutral: "सीमित दायरा" },
    impactLabels: ["इक्विटीज", "क्रिप्टो", "एफएक्स", "रेट्स"],
    sectorNames: ["टेक", "फाइनेंस", "एनर्जी", "लॉजिस्टिक्स"]
  },
  es: {
    riskLabels: { High: "Alto", Medium: "Medio", Low: "Bajo" },
    fitLabels: { Strong: "Fuerte", Moderate: "Moderado", Weak: "Débil" },
    monthLabels: ["Mes 1", "Mes 2", "Mes 3", "Mes 4", "Mes 5", "Mes 6"],
    ideaSummary: ({ sector, riskLevel, marketFit }) => `La idea encaja mejor en ${sector} y muestra señales de market fit ${marketFit.toLowerCase()}, pero la ejecución debe ser rigurosa para mantener el riesgo ${riskLevel.toLowerCase()} controlado.`,
    ideaActions: [
      "Validar la demanda con diez a quince clientes objetivo antes de ampliar el alcance.",
      "Convertir la primera versión en un MVP enfocado con una métrica principal de éxito.",
      "Definir responsables de compliance, pricing y go-to-market antes de acelerar contrataciones."
    ],
    roadmapLabels: ["Validación inmediata", "Construcción operativa", "Decisión de escala"],
    roadmapDetails: [
      "Probar el problema del cliente, la disposición a pagar y la fricción de onboarding con entrevistas reales y una landing page rápida.",
      "Construir el flujo mínimo útil, fijar la base de unit economics y preparar listas de compliance y operaciones.",
      "Expandir canales solo cuando retención, conversión y carga de soporte estén dentro del objetivo."
    ],
    newsGlobal: ({ sector, emotion }) => `El evento puede generar una lectura global ${emotion.toLowerCase()}, con el mayor efecto indirecto sobre ${sector.toLowerCase()} y activos de riesgo relacionados.`,
    newsNarrative: ({ sourceType }) => `El mercado probablemente operará primero el titular y después los fundamentos. ${sourceType === "url" ? "Como el insumo proviene de un artículo enlazado, la extracción prioriza el titular y el cuerpo principal." : "Como el insumo proviene de texto pegado, el escenario se apoya en el lenguaje y la urgencia presentes en la entrada."}`,
    shortTerm: { positive: "Constructivo", negative: "Volátil", neutral: "Mixto" },
    longTerm: { positive: "Sesgo alcista", negative: "Recuperación selectiva", neutral: "Lateral" },
    impactLabels: ["Acciones", "Cripto", "FX", "Tasas"],
    sectorNames: ["Tecnología", "Finanzas", "Energía", "Logística"]
  }
};

const SECTOR_KEYWORDS = {
  Fintech: ["fintech", "payments", "bank", "lending", "credit", "wallet", "insurance", "regtech", "finance", "भुगतान", "क्रेडिट", "ऋण", "वित्त", "merchant", "merchants"],
  AI: ["ai", "llm", "automation", "machine learning", "agent", "data", "analytics", "model"],
  HealthTech: ["health", "medical", "clinic", "patient", "diagnostic", "care"],
  Climate: ["climate", "carbon", "solar", "battery", "energy", "sustainability", "green"],
  Logistics: ["supply chain", "logistics", "shipping", "warehouse", "delivery", "fleet"],
  Commerce: ["ecommerce", "retail", "marketplace", "merchant", "shop", "consumer"]
};

const POSITIVE_NEWS = ["growth", "surge", "approval", "profit", "record", "funding", "partnership", "expand", "recovery", "gain", "beats", "aprueba", "crecimiento", "acuerdo", "ganancia", "recuperacion", "मंजूरी", "वृद्धि", "साझेदारी", "लाभ"];
const NEGATIVE_NEWS = ["ban", "war", "fraud", "lawsuit", "crash", "layoff", "decline", "tariff", "sanction", "hack", "downturn", "loss", "prohibicion", "caida", "demanda", "sancion", "guerra", "प्रतिबंध", "गिरावट", "मुकदमा", "युद्ध"];

function normalizeWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function pickLanguage(input, acceptLanguage, forcedLanguage) {
  if (forcedLanguage === "en" || forcedLanguage === "hi" || forcedLanguage === "es") return forcedLanguage;
  const sample = `${input || ""} ${acceptLanguage || ""}`.toLowerCase();
  if (/[\u0900-\u097f]/.test(sample) || /\bhi\b|hindi/.test(sample)) return "hi";
  if (/\b(es|spanish)\b/.test(sample) || /[¿¡]/.test(sample)) return "es";
  return "en";
}

function getLanguagePack(language) {
  return LANGUAGE_PACKS[language] || LANGUAGE_PACKS.en;
}

function tokenize(text) {
  return normalizeWhitespace(text)
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

function extractKeywords(text, limit = 6) {
  const scores = new Map();
  for (const token of tokenize(text)) {
    scores.set(token, (scores.get(token) || 0) + 1);
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([token]) => token.replace(/^\w/, (char) => char.toUpperCase()));
}

function detectSector(text) {
  const lower = normalizeWhitespace(text).toLowerCase();
  let best = { name: "Fintech", score: 0 };

  for (const [name, keywords] of Object.entries(SECTOR_KEYWORDS)) {
    const score = keywords.reduce((sum, keyword) => sum + (lower.includes(keyword) ? 1 : 0), 0);
    if (score > best.score) best = { name, score };
  }

  return best.name;
}

function scoreIdea(text) {
  const lower = normalizeWhitespace(text).toLowerCase();
  let opportunity = 30;
  let risk = 35;

  if (/\b(b2b|subscription|saas|api|compliance|pilot|mvp|automation|workflow)\b/.test(lower)) opportunity += 12;
  if (/\b(fintech|payments|credit|lending|insurance|bank)\b/.test(lower)) opportunity += 8;
  if (/\b(ai|analytics|data|model)\b/.test(lower)) opportunity += 8;
  if (/\b(global|cross-border|regulated|license|crypto|blockchain)\b/.test(lower)) risk += 18;
  if (/\b(early stage|prototype|idea|explore|maybe)\b/.test(lower)) risk += 10;
  if (/\b(partner|distribution|enterprise|existing customers|traction|revenue)\b/.test(lower)) opportunity += 10;

  const sizeBias = Math.min(12, Math.floor(lower.length / 120));
  opportunity += sizeBias;
  risk += Math.max(0, 8 - sizeBias);

  return {
    opportunity: Math.max(0, Math.min(opportunity, 95)),
    risk: Math.max(0, Math.min(risk, 92))
  };
}

function labelRisk(score) {
  if (score >= 68) return "High";
  if (score >= 46) return "Medium";
  return "Low";
}

function labelMarketFit(score) {
  if (score >= 68) return "Strong";
  if (score >= 48) return "Moderate";
  return "Weak";
}

function buildIdeaSimulation(idea, acceptLanguage, forcedLanguage) {
  const text = normalizeWhitespace(idea);
  const language = pickLanguage(text, acceptLanguage, forcedLanguage);
  const pack = getLanguagePack(language);
  const sector = detectSector(text);
  const { opportunity, risk } = scoreIdea(text);
  const riskLevel = pack.riskLabels[labelRisk(risk)];
  const marketFit = pack.fitLabels[labelMarketFit(opportunity)];
  const keywords = extractKeywords(text);
  const monthlyBase = 18000 + opportunity * 350;
  const projections = Array.from({ length: 6 }, (_, index) => Math.round(monthlyBase * Math.pow(1.22, index)));

  return {
    language,
    keywords,
    metrics: {
      riskLevel,
      marketFit
    },
    summary: pack.ideaSummary({ sector, riskLevel, marketFit }),
    roadmap: pack.roadmapLabels.map((phase, index) => ({
      phase,
      detail: pack.roadmapDetails[index],
      tone: index === 0 ? "urgent" : index === 1 ? "warning" : "upcoming"
    })),
    projections: {
      labels: pack.monthLabels,
      values: projections
    },
    actions: pack.ideaActions
  };
}

function clamp(number, min, max) {
  return Math.max(min, Math.min(number, max));
}

function percentLabel(value) {
  const rounded = Math.round(value);
  if (rounded > 0) return `+${rounded}%`;
  if (rounded < 0) return `${rounded}%`;
  return "0%";
}

function buildChartDatasets(sentimentScore) {
  const optimisticStart = 100;
  const baselineDrift = sentimentScore >= 0 ? 3 : -2;
  const optimistic = [100, 103, 108, 114, 121, 129].map((value, index) => value + sentimentScore * index);
  const baseline = [100, 101, 103, 106, 109, 113].map((value, index) => value + baselineDrift * index);
  const stressed = [100, 98, 95, 91, 88, 84].map((value, index) => value + Math.min(2, sentimentScore) * index);

  return {
    labels: ["Now", "4h", "24h", "3d", "1w", "1m"],
    datasets: [
      { label: "Optimistic", values: optimistic, borderColor: "#10b981" },
      { label: "Baseline", values: baseline, borderColor: "#3b82f6" },
      { label: "Stressed", values: stressed, borderColor: "#ef4444", borderDash: [6, 5] }
    ]
  };
}

function determineEmotion(score, pack) {
  if (score > 2) return { key: "positive", word: pack.shortTerm.positive };
  if (score < -2) return { key: "negative", word: pack.shortTerm.negative };
  return { key: "neutral", word: pack.shortTerm.neutral };
}

function buildNewsSimulation(input, acceptLanguage, sourceType, forcedLanguage) {
  const text = normalizeWhitespace(input);
  const language = pickLanguage(text, acceptLanguage, forcedLanguage);
  const pack = getLanguagePack(language);
  const sector = detectSector(text);
  const lower = text.toLowerCase();
  const positiveHits = POSITIVE_NEWS.reduce((sum, word) => sum + (lower.includes(word) ? 1 : 0), 0);
  const negativeHits = NEGATIVE_NEWS.reduce((sum, word) => sum + (lower.includes(word) ? 1 : 0), 0);
  const sentimentScore = clamp((positiveHits - negativeHits) * 3 + (lower.includes("regulation") ? -1 : 0), -9, 9);
  const emotion = determineEmotion(sentimentScore, pack);
  const themes = extractKeywords(text, 5);

  const labels = pack.impactLabels;
  const impactValues = [
    clamp(sentimentScore * 1.4, -12, 12),
    clamp(sentimentScore * 1.8 + (lower.includes("crypto") ? 3 : 0), -16, 16),
    clamp(sentimentScore * 0.8, -7, 7),
    clamp(sentimentScore * -0.6, -8, 8)
  ];

  const impactTones = impactValues.map((value, index) => {
    if (index === 3) {
      if (value >= 2) return "badge-yellow";
      if (value <= -2) return "badge-red";
      return "badge-green";
    }
    if (value > 1) return "badge-green";
    if (value < -1) return "badge-red";
    return "badge-yellow";
  });

  const futureKey = sentimentScore > 2 ? "positive" : sentimentScore < -2 ? "negative" : "neutral";

  return {
    language,
    themes,
    marketImpact: labels.map((label, index) => ({
      label,
      value: index === 3 ? (impactValues[index] > 1 ? "Yield pressure" : impactValues[index] < -1 ? "Flight to safety" : "Stable") : percentLabel(impactValues[index]),
      tone: impactTones[index]
    })),
    globalEffect: pack.newsGlobal({ sector, emotion: emotion.word }),
    futurePrediction: {
      shortTerm: pack.shortTerm[futureKey],
      longTerm: pack.longTerm[futureKey]
    },
    narrativeInsight: pack.newsNarrative({ sourceType }),
    sectors: [
      { name: pack.sectorNames[0], outlook: sentimentScore >= 0 ? "Momentum may improve if execution data confirms the headline." : "Valuation sensitivity remains high while investors reprice risk.", icon: "fa-solid fa-microchip", color: "green" },
      { name: pack.sectorNames[1], outlook: lower.includes("rate") || lower.includes("bank") ? "Policy sensitivity is elevated, so spreads and liquidity will matter." : "Balance-sheet quality and customer trust will shape the next move.", icon: "fa-solid fa-building-columns", color: "yellow" },
      { name: pack.sectorNames[2], outlook: lower.includes("energy") ? "Commodity-linked names could react first and then mean-revert." : "Second-order inflation expectations remain the main watchpoint.", icon: "fa-solid fa-bolt", color: "red" },
      { name: pack.sectorNames[3], outlook: lower.includes("shipping") || lower.includes("supply chain") ? "Freight and fulfillment operators may see the earliest operational spillover." : "Cross-border and delivery networks may feel downstream demand changes.", icon: "fa-solid fa-truck-fast", color: "yellow" }
    ],
    chart: buildChartDatasets(sentimentScore)
  };
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === "object") {
      resolve(req.body);
      return;
    }

    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error("Payload too large."));
      }
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error("Invalid JSON body."));
      }
    });
    req.on("error", reject);
  });
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function stripTags(value) {
  return decodeHtml(String(value || "").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
}

function extractMetaContent(html, key) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["']`, "i")
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) return decodeHtml(match[1]);
  }

  return "";
}

async function extractArticleText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "MarketMindSim/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch article URL (${response.status}).`);
  }

  const html = await response.text();
  const title = extractMetaContent(html, "og:title") || (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1] || "";
  const description = extractMetaContent(html, "description") || extractMetaContent(html, "og:description") || "";
  const articleText = stripTags(
    (html.match(/<article[\s\S]*?<\/article>/i) || [])[0] ||
    (html.match(/<main[\s\S]*?<\/main>/i) || [])[0] ||
    html
  );

  return normalizeWhitespace(`${title}. ${description}. ${articleText}`).slice(0, 7000);
}

module.exports = {
  buildIdeaSimulation,
  buildNewsSimulation,
  extractArticleText,
  normalizeWhitespace,
  readRequestBody
};
