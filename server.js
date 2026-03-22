"use strict";

const { loadLocalEnv } = require("./lib/env");
const fs = require("fs");
const http = require("http");
const path = require("path");
const { extractArticleText, normalizeWhitespace, readRequestBody } = require("./lib/simulation");
const { generateIdeaSimulation, generateNewsSimulation } = require("./lib/llm");

loadLocalEnv(__dirname);

const PORT = Number(process.env.PORT || 8787);
const INDEX_PATH = path.join(__dirname, "index.html");

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Accept-Language",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
  });
  res.end(JSON.stringify(payload));
}

function sendHtml(res, statusCode, html) {
  res.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(html);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Accept-Language",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
      });
      res.end();
      return;
    }

    if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
      sendHtml(res, 200, fs.readFileSync(INDEX_PATH, "utf8"));
      return;
    }

    if (req.method === "GET" && req.url === "/api/health") {
      const provider = (process.env.API_PROVIDER || "gemini").toLowerCase();
      const configured =
        provider === "huggingface" || provider === "hf"
          ? Boolean(process.env.HF_TOKEN)
          : Boolean(process.env.GEMINI_API_KEY);

      sendJson(res, 200, {
        ok: true,
        service: "marketmind-simulations-v2",
        provider,
        externalApiConfigured: configured
      });
      return;
    }

    if (req.method === "POST" && req.url === "/api/simulate/idea") {
      const body = await readRequestBody(req);
      const idea = normalizeWhitespace(body.idea);
      const language = normalizeWhitespace(body.language);
      if (!idea) {
        sendJson(res, 400, { error: "Idea is required." });
        return;
      }

      sendJson(res, 200, await generateIdeaSimulation({
        idea,
        acceptLanguage: req.headers["accept-language"],
        language: language === "auto" ? "" : language
      }));
      return;
    }

    if (req.method === "POST" && req.url === "/api/simulate/news") {
      const body = await readRequestBody(req);
      const url = normalizeWhitespace(body.url);
      const text = normalizeWhitespace(body.text);
      const language = normalizeWhitespace(body.language);

      if (!url && !text) {
        sendJson(res, 400, { error: "Provide article text or a URL." });
        return;
      }

      let sourceText = text;
      let sourceType = "text";

      if (!sourceText && url) {
        sourceText = await extractArticleText(url);
        sourceType = "url";
      } else if (sourceText && url) {
        sourceText = `${sourceText} ${url}`;
      }

      sendJson(res, 200, await generateNewsSimulation({
        text: sourceText,
        acceptLanguage: req.headers["accept-language"],
        sourceType,
        language: language === "auto" ? "" : language
      }));
      return;
    }

    sendJson(res, 404, { error: "Not found." });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Unexpected server error." });
  }
});

if (require.main === module) {
  server.listen(PORT, "127.0.0.1", () => {
    console.log(`MarketMind simulations running at http://127.0.0.1:${PORT}`);
  });
}

module.exports = server;
