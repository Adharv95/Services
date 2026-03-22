"use strict";

module.exports = async function handler(_req, res) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: true, service: "marketmind-simulations-v2" }));
};
