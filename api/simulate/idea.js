"use strict";

const { normalizeWhitespace, readRequestBody } = require("../../lib/simulation");
const { generateIdeaSimulation } = require("../../lib/llm");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed." }));
    return;
  }

  try {
    const body = await readRequestBody(req);
    const idea = normalizeWhitespace(body.idea);
    const language = normalizeWhitespace(body.language);

    if (!idea) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Idea is required." }));
      return;
    }

    const result = await generateIdeaSimulation({
      idea,
      acceptLanguage: req.headers["accept-language"],
      language: language === "auto" ? "" : language
    });
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(result));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: error.message || "Unable to generate strategy." }));
  }
};
