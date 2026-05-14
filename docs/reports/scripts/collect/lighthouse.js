#!/usr/bin/env node
/**
 * Lighthouse audit collector.
 * Runs Lighthouse against each public page of the deployed web app.
 *
 * Usage: node collect/lighthouse.js <web-base-url>
 * Output: ../output/lighthouse.json
 */

"use strict";

const fs = require("fs");
const path = require("path");
const chromeLauncher = require("chrome-launcher");
const { default: lighthouse } = require("lighthouse");

const PAGES = [
  { name: "Home", path: "/home" },
  { name: "Adopt Listing", path: "/adopt" },
  { name: "Animal Detail", path: "/adopt/1" },
  { name: "About", path: "/about" },
  { name: "Blog", path: "/blog" },
];

const LIGHTHOUSE_FLAGS = {
  logLevel: "error",
  output: "json",
  onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
  formFactor: "desktop",
  screenEmulation: {
    mobile: false,
    width: 1350,
    height: 940,
    deviceScaleFactor: 1,
    disabled: false,
  },
  throttlingMethod: "provided",
  throttling: {
    rttMs: 0,
    throughputKbps: 0,
    cpuSlowdownMultiplier: 1,
    requestLatencyMs: 0,
    downloadThroughputKbps: 0,
    uploadThroughputKbps: 0,
  },
};

async function runLighthouse(url, port) {
  const result = await lighthouse(url, { ...LIGHTHOUSE_FLAGS, port });
  const { categories, audits } = result.lhr;
  return {
    url,
    scores: {
      performance: Math.round((categories.performance?.score ?? 0) * 100),
      accessibility: Math.round((categories.accessibility?.score ?? 0) * 100),
      bestPractices: Math.round((categories["best-practices"]?.score ?? 0) * 100),
      seo: Math.round((categories.seo?.score ?? 0) * 100),
    },
    metrics: {
      lcp: audits["largest-contentful-paint"]?.numericValue ?? null,
      fid: audits["max-potential-fid"]?.numericValue ?? null,
      cls: audits["cumulative-layout-shift"]?.numericValue ?? null,
      ttfb: audits["server-response-time"]?.numericValue ?? null,
      si: audits["speed-index"]?.numericValue ?? null,
      tbt: audits["total-blocking-time"]?.numericValue ?? null,
    },
  };
}

async function main() {
  const baseUrl = process.argv[2];
  if (!baseUrl) {
    console.error("Usage: node collect/lighthouse.js <web-base-url>");
    process.exit(1);
  }

  const outputDir = path.join(__dirname, "..", "output");
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`[lighthouse] Target: ${baseUrl}`);
  console.log(`[lighthouse] Pages: ${PAGES.map((p) => p.path).join(", ")}`);

  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage"],
  });

  const results = [];
  try {
    for (const page of PAGES) {
      const url = `${baseUrl.replace(/\/$/, "")}${page.path}`;
      console.log(`[lighthouse] Auditing ${url} ...`);
      const data = await runLighthouse(url, chrome.port);
      results.push({ ...data, pageName: page.name });
      console.log(
        `[lighthouse]   Performance=${data.scores.performance} Accessibility=${data.scores.accessibility} ` +
          `BestPractices=${data.scores.bestPractices} SEO=${data.scores.seo}`
      );
    }
  } finally {
    await chrome.kill();
  }

  const output = {
    tool: "Lighthouse v12",
    collectedAt: new Date().toISOString(),
    target: baseUrl,
    preset: "Desktop (1350×940, no throttling)",
    pages: results,
  };

  const outFile = path.join(outputDir, "lighthouse.json");
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2));
  console.log(`[lighthouse] Saved → ${outFile}`);
}

main().catch((err) => {
  console.error("[lighthouse] Fatal:", err.message);
  process.exit(1);
});
