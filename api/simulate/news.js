"use strict";

const { extractArticleText, normalizeWhitespace, readRequestBody } = require("../../lib/simulation");
const { generateNewsSimulation } = require("../../lib/llm");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed." }));
    return;
  }

  try {
    const body = await readRequestBody(req);
    const url = normalizeWhitespace(body.url);
    const text = normalizeWhitespace(body.text);
    const language = normalizeWhitespace(body.language);

    if (!url && !text) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Provide article text or a URL." }));
      return;
    }

    let sourceText = text;
    let sourceType = "text";

    if (!sourceText && url) {
      sourceText = await extractArticleText(url);
      sourceType = "url";
    } else if (sourceText && url) {
      sourceText = `${sourceText} ${url}`;
      sourceType = "text";
    }

    const result = await generateNewsSimulation({
      text: sourceText,
      acceptLanguage: req.headers["accept-language"],
      sourceType,
      language: language === "auto" ? "" : language
    });
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(result));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: error.message || "Unable to simulate news impact." }));
  }
};
