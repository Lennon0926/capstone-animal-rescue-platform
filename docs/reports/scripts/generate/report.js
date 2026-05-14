#!/usr/bin/env node
/**
 * Report generator — reads all collected JSON output files and calls Claude API
 * to produce updated markdown sections for the docs/reports directory.
 *
 * Usage: node generate/report.js
 * Requires: ANTHROPIC_API_KEY env variable
 * Input:  ../output/{lighthouse,accessibility,load-test,test-results}.json
 * Output: ../../section-3-{1,2,3,4}-*.md
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { Anthropic } = require("@anthropic-ai/sdk");

const OUTPUT_DIR = path.join(__dirname, "..", "output");
const REPORTS_DIR = path.join(__dirname, "..", "..");

const SECTIONS = [
  {
    id: "lighthouse",
    outputFile: "section-3-1-lighthouse-audit.md",
    dataFile: "lighthouse.json",
    title: "Section 3.1 — Page Performance Results (Lighthouse)",
    prompt: (data) => `
You are a technical writer for a software engineering capstone project report.
Write Section 3.1 of the report using the Lighthouse audit data below.

Rules:
- Use the exact heading: "# Section 3.1 — Page Performance Results (Lighthouse)"
- Include a configuration table with: Tool, Target, Preset, Run date
- Include a pages audited table (5 pages: /home, /adopt, /adopt/1, /about, /blog)
- Include this chart reference exactly: ![Lighthouse Scores by Page — Performance, Accessibility, Best Practices, SEO](./charts/lighthouse-scores.svg)
- Include a scores table (Performance, Accessibility, Best Practices, SEO per page) — bold values ≥ 90
- Include a Core Web Vitals / metrics table (LCP, CLS, TTFB, SI, TBT per page, in ms or raw)
- Include a short analysis paragraph (2-4 sentences) noting any pages below 90, or confirming all pages pass
- Use GitHub-flavored Markdown tables
- Do NOT include HTML, do NOT include front matter
- Run date is today: ${new Date().toISOString().slice(0, 10)}
- Target is the deployed URL from the data

Lighthouse audit data:
${JSON.stringify(data, null, 2)}
`.trim(),
  },
  {
    id: "load-test",
    outputFile: "section-3-2-load-test-results.md",
    dataFile: "load-test.json",
    title: "Section 3.2 — Load Test Results",
    prompt: (data) => `
You are a technical writer for a software engineering capstone project report.
Write Section 3.2 of the report using the Artillery load test data below.

Rules:
- Use the exact heading: "# Section 3.2 — Load Test Results"
- Include a configuration table with: Tool, Target, Profile (VU counts + duration), Run date
- Include the endpoint weights table (Health Check 10%, List Animals 45%, Filter Options 15%, Single Animal 20%, Upload Config 10%)
- Include this chart reference exactly: ![p95 Response Time per Endpoint](./charts/load-test-p95.svg)
- Include a results table with: totalRequests, totalResponses, http2xx, http429, http4xx, http5xx, p50, p95, p99, min, max, requestRate
- Bold p95 value — if ≤ 2000ms write "PASS", else write "FAIL"
- Include a short analysis paragraph (2-4 sentences)
- Use GitHub-flavored Markdown tables
- Do NOT include HTML, do NOT include front matter
- Run date is today: ${new Date().toISOString().slice(0, 10)}

Load test data:
${JSON.stringify(data, null, 2)}
`.trim(),
  },
  {
    id: "accessibility",
    outputFile: "section-3-3-accessibility-audit.md",
    dataFile: "accessibility.json",
    title: "Section 3.3 — Accessibility Audit Results (WCAG 2.1 AA)",
    prompt: (data) => `
You are a technical writer for a software engineering capstone project report.
Write Section 3.3 of the report using the pa11y + axe-core accessibility audit data below.

Rules:
- Use the exact heading: "# Section 3.3 — Accessibility Audit Results (WCAG 2.1 AA)"
- Include a configuration table with: Tool, WCAG Standard, Browser/Runner, Target, Run date
- Include the pages table (name, URL, total issues)
- Include this chart reference exactly: ![Accessibility Violations by Page — WCAG 2.1 AA Current State](./charts/accessibility-violations.svg)
- Include a summary table: Page | Critical | Serious | Moderate | Minor | Status
  - Status = PASS if critical+serious = 0, else FAIL
- For each page with issues > 0, list the top 3 issues (code, message, impact)
- Include a short analysis paragraph (2-4 sentences)
- Use GitHub-flavored Markdown tables
- Do NOT include HTML, do NOT include front matter
- Run date is today: ${new Date().toISOString().slice(0, 10)}

Accessibility audit data:
${JSON.stringify(data, null, 2)}
`.trim(),
  },
  {
    id: "test-results",
    outputFile: "section-3-4-test-results.md",
    dataFile: "test-results.json",
    title: "Section 3.4 — Unit and Integration Test Results",
    prompt: (data) => `
You are a technical writer for a software engineering capstone project report.
Write Section 3.4 of the report using the Jest test results data below.

Rules:
- Use the exact heading: "# Section 3.4 — Unit and Integration Test Results"
- Include this chart reference exactly: ![Test Suite Summary](./charts/test-suite-summary.svg)
- Include this chart reference exactly: ![Server Jest — Tests per File](./charts/test-server-breakdown.svg)
- Include a summary table: Suite | Tool | Spec Files | Total Tests | Passed | Failed | Skipped | Pass Rate
  - Bold pass rate; write 100% as "**100%**"
- For each suite, include a per-file breakdown table: File | Tests | Passed | Failed | Status
  - Status = Pass if failed = 0, else Fail
- Include a short analysis paragraph (2-4 sentences)
- Use GitHub-flavored Markdown tables
- Do NOT include HTML, do NOT include front matter
- Run date is today: ${new Date().toISOString().slice(0, 10)}

Test results data:
${JSON.stringify(data, null, 2)}
`.trim(),
  },
];

function loadJson(filename) {
  const filepath = path.join(OUTPUT_DIR, filename);
  if (!fs.existsSync(filepath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filepath, "utf8"));
}

async function generateSection(client, section) {
  const data = loadJson(section.dataFile);
  if (!data) {
    console.warn(`[report] Missing ${section.dataFile} — skipping ${section.id}`);
    return false;
  }

  console.log(`[report] Generating ${section.outputFile} ...`);

  const message = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: section.prompt(data),
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    console.error(`[report] Unexpected response type: ${content.type}`);
    return false;
  }

  const outPath = path.join(REPORTS_DIR, section.outputFile);
  fs.writeFileSync(outPath, content.text.trim() + "\n");
  console.log(`[report] Saved → ${outPath}`);
  return true;
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[report] ANTHROPIC_API_KEY is not set");
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });

  console.log(`[report] Output dir: ${OUTPUT_DIR}`);
  console.log(`[report] Reports dir: ${REPORTS_DIR}`);

  let generated = 0;
  let skipped = 0;

  for (const section of SECTIONS) {
    const ok = await generateSection(client, section);
    if (ok) generated++;
    else skipped++;
  }

  console.log(`[report] Done — ${generated} generated, ${skipped} skipped`);
  if (skipped > 0) {
    console.log(`[report] Run collectors first for skipped sections`);
  }
}

main().catch((err) => {
  console.error("[report] Fatal:", err.message);
  process.exit(1);
});
