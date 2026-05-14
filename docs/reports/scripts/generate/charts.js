#!/usr/bin/env node
/**
 * SVG chart generator — produces charts matching the existing docs/reports/charts/ style.
 * Font: ui-monospace,SFMono-Regular,Menlo,monospace  Width: 760px  Background: #ffffff
 *
 * Usage: node generate/charts.js
 * Input:  ../output/{lighthouse,accessibility,load-test,test-results}.json
 * Output: ../../charts/{lighthouse-scores,accessibility-violations,load-test-p95,
 *                        test-suite-summary,test-server-breakdown}.svg
 */

"use strict";

const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join(__dirname, "..", "output");
const CHARTS_DIR = path.join(__dirname, "..", "..", "charts");

const FONT = "ui-monospace,SFMono-Regular,Menlo,monospace";
const COLORS = {
  performance: "#4361ee",
  accessibility: "#3a9d5c",
  bestPractices: "#f4a261",
  seo: "#9b59b6",
  critical: "#ef4444",
  serious: "#f97316",
  moderate: "#eab308",
  minor: "#84cc16",
  p95: "#4361ee",
  p99: "#ef4444",
  passed: "#3a9d5c",
  failed: "#ef4444",
  skipped: "#f4a261",
  server: "#4361ee",
  web: "#3a9d5c",
  grid: "#e5e7eb",
  axis: "#9ca3af",
  text: "#374151",
  muted: "#6b7280",
  title: "#111827",
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function svgWrap(width, height, content, subtitle = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="${FONT}" font-size="13">
  <rect width="${width}" height="${height}" fill="#ffffff" rx="8"/>
${content}
</svg>`;
}

function yGridlines(plotLeft, plotRight, plotTop, plotBottom, steps, maxVal) {
  let out = "";
  for (const step of steps) {
    const y = plotBottom - ((step / maxVal) * (plotBottom - plotTop));
    out += `  <line x1="${plotLeft}" y1="${y.toFixed(1)}" x2="${plotRight}" y2="${y.toFixed(1)}" stroke="${COLORS.grid}" stroke-width="1" stroke-dasharray="4,3"/>\n`;
    out += `  <text x="${plotLeft - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="10" fill="${COLORS.muted}">${step}</text>\n`;
  }
  return out;
}

function axes(plotLeft, plotRight, plotTop, plotBottom, yLabel) {
  return `
  <line x1="${plotLeft}" y1="${plotTop}" x2="${plotLeft}" y2="${plotBottom}" stroke="${COLORS.axis}" stroke-width="1.5"/>
  <line x1="${plotLeft}" y1="${plotBottom}" x2="${plotRight}" y2="${plotBottom}" stroke="${COLORS.axis}" stroke-width="1.5"/>
  <text x="${plotLeft - 40}" y="${(plotTop + plotBottom) / 2}" text-anchor="middle" font-size="11" fill="${COLORS.muted}" transform="rotate(-90 ${plotLeft - 40} ${(plotTop + plotBottom) / 2})">${esc(yLabel)}</text>`;
}

function legend(items, startX, y) {
  let out = "";
  let x = startX;
  for (const { label, color } of items) {
    out += `  <rect x="${x}" y="${y - 10}" width="14" height="14" fill="${color}" rx="2"/>\n`;
    out += `  <text x="${x + 18}" y="${y}" font-size="11" fill="${COLORS.text}">${esc(label)}</text>\n`;
    x += label.length * 7 + 40;
  }
  return out;
}

// ─── 1. Lighthouse Scores ────────────────────────────────────────────────────

function generateLighthouseChart(data) {
  const pages = data.pages;
  const W = 760, H = 500;
  const plotLeft = 60, plotRight = 730, plotTop = 95, plotBottom = 370;
  const plotW = plotRight - plotLeft;
  const plotH = plotBottom - plotTop;

  const nGroups = pages.length;
  const groupW = plotW / nGroups;
  const barKeys = ["performance", "accessibility", "bestPractices", "seo"];
  const barW = 18;
  const barGap = 4;
  const groupBarW = barKeys.length * (barW + barGap) - barGap;

  let bars = "";
  pages.forEach((page, gi) => {
    const groupX = plotLeft + gi * groupW + (groupW - groupBarW) / 2;
    barKeys.forEach((key, bi) => {
      const score = page.scores[key] ?? 0;
      const barH = (score / 100) * plotH;
      const x = groupX + bi * (barW + barGap);
      const y = plotBottom - barH;
      bars += `  <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW}" height="${barH.toFixed(1)}" fill="${COLORS[key]}" rx="2"/>\n`;
      if (score < 100) {
        bars += `  <text x="${(x + barW / 2).toFixed(1)}" y="${(y - 3).toFixed(1)}" text-anchor="middle" font-size="9" fill="${COLORS[key]}">${score}</text>\n`;
      }
    });
    // Page label
    const labelX = plotLeft + gi * groupW + groupW / 2;
    const shortName = page.pageName.replace("Animal Detail", "/adopt/1").replace("Adopt Listing", "/adopt").replace("Home", "/home").replace("About", "/about").replace("Blog", "/blog");
    bars += `  <text x="${labelX.toFixed(1)}" y="${plotBottom + 16}" text-anchor="middle" font-size="10" fill="${COLORS.muted}">${esc(shortName)}</text>\n`;
  });

  const subtitle = `${pages.length} public pages · Desktop preset · ${data.target} · ${data.collectedAt.slice(0, 10)}`;

  const content = `
  <text x="${W / 2}" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="${COLORS.title}">Lighthouse Audit — Page Performance Scores</text>
  <text x="${W / 2}" y="45" text-anchor="middle" font-size="11" fill="${COLORS.muted}">${esc(subtitle)}</text>
${legend([
    { label: "Performance", color: COLORS.performance },
    { label: "Accessibility", color: COLORS.accessibility },
    { label: "Best Practices", color: COLORS.bestPractices },
    { label: "SEO", color: COLORS.seo },
  ], 80, 72)}
${axes(plotLeft, plotRight, plotTop, plotBottom, "Score (0–100)")}
${yGridlines(plotLeft, plotRight, plotTop, plotBottom, [100, 75, 50, 25], 100)}
  <text x="${plotLeft}" y="${plotBottom + 16}" text-anchor="middle" font-size="10" fill="${COLORS.muted}">0</text>
${bars}`;

  return svgWrap(W, H, content);
}

// ─── 2. Accessibility Violations ─────────────────────────────────────────────

function generateAccessibilityChart(data) {
  const pages = data.pages;
  const W = 760, H = 460;
  const plotLeft = 60, plotRight = 720, plotTop = 90, plotBottom = 340;
  const plotH = plotBottom - plotTop;
  const plotW = plotRight - plotLeft;

  // Find max total for y-axis
  const maxTotal = Math.max(...pages.map((p) => p.total ?? 0), 4);
  const yMax = Math.ceil(maxTotal / 2) * 2 || 4;

  const nGroups = pages.length;
  const groupW = plotW / nGroups;
  const barW = 28;

  let bars = "";
  pages.forEach((page, gi) => {
    const x = plotLeft + gi * groupW + (groupW - barW) / 2;
    const total = page.total ?? 0;

    if (total === 0) {
      bars += `  <rect x="${x.toFixed(1)}" y="${(plotBottom - 2).toFixed(1)}" width="${barW}" height="2" fill="#d1fae5" rx="1"/>\n`;
      bars += `  <text x="${(x + barW / 2).toFixed(1)}" y="${(plotBottom - 6).toFixed(1)}" text-anchor="middle" font-size="9" fill="${COLORS.accessibility}">0</text>\n`;
    } else {
      // Stacked bar: critical/serious/moderate/minor
      let stackY = plotBottom;
      const levels = ["critical", "serious", "moderate", "minor"];
      for (const level of levels) {
        const count = page.counts?.[level] ?? 0;
        if (count === 0) continue;
        const bH = (count / yMax) * plotH;
        stackY -= bH;
        bars += `  <rect x="${x.toFixed(1)}" y="${stackY.toFixed(1)}" width="${barW}" height="${bH.toFixed(1)}" fill="${COLORS[level]}" rx="1"/>\n`;
      }
      bars += `  <text x="${(x + barW / 2).toFixed(1)}" y="${(stackY - 4).toFixed(1)}" text-anchor="middle" font-size="9" fill="${COLORS.title}">${total}</text>\n`;
    }

    const labelX = plotLeft + gi * groupW + groupW / 2;
    const shortName = page.pageName.replace("Animal Detail", "/adopt/1").replace("Adopt Listing", "/adopt").replace("Home", "/home").replace("About", "/about").replace("Blog", "/blog");
    bars += `  <text x="${labelX.toFixed(1)}" y="${plotBottom + 16}" text-anchor="middle" font-size="10" fill="${COLORS.muted}">${esc(shortName)}</text>\n`;
  });

  const gridSteps = Array.from({ length: Math.ceil(yMax / 2) + 1 }, (_, i) => i * 2).filter((s) => s <= yMax);

  const subtitle = `${pages.length} public pages · WCAG 2.1 AA · axe-core · ${data.target} · ${data.collectedAt.slice(0, 10)}`;

  const content = `
  <text x="${W / 2}" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="${COLORS.title}">Accessibility Audit — WCAG 2.1 AA Violations</text>
  <text x="${W / 2}" y="45" text-anchor="middle" font-size="11" fill="${COLORS.muted}">${esc(subtitle)}</text>
${legend([
    { label: "Critical", color: COLORS.critical },
    { label: "Serious", color: COLORS.serious },
    { label: "Moderate", color: COLORS.moderate },
    { label: "Minor", color: COLORS.minor },
  ], 120, 68)}
${axes(plotLeft, plotRight, plotTop, plotBottom, "Violation Count")}
${yGridlines(plotLeft, plotRight, plotTop, plotBottom, gridSteps, yMax)}
${bars}`;

  return svgWrap(W, H, content);
}

// ─── 3. Load Test p95 ────────────────────────────────────────────────────────

function generateLoadTestChart(data) {
  const W = 760, H = 420;
  const plotLeft = 90, plotRight = 720, plotTop = 90, plotBottom = 300;
  const plotH = plotBottom - plotTop;
  const plotW = plotRight - plotLeft;

  const endpoints = [
    { name: "/health", key: "Health Check" },
    { name: "/api/animals", key: "List Animals" },
    { name: "/api/animals/filters", key: "Filter Options" },
    { name: "/api/animals/:id", key: "Single Animal" },
    { name: "/api/uploads/config", key: "Upload Config" },
  ];

  // Use overall p95/p99 when per-scenario data not available
  const overallP95 = data.summary?.p95 ?? 0;
  const overallP99 = data.summary?.p99 ?? 0;

  // For display, show overall p95 for each endpoint (artillery aggregate only)
  const values = endpoints.map(() => ({ p95: overallP95, p99: overallP99 }));

  const yMax = Math.max(overallP99 * 1.2, 500);
  const groupW = plotW / endpoints.length;
  const barW = 22;
  const barGap = 6;

  let bars = "";
  endpoints.forEach((ep, i) => {
    const { p95, p99 } = values[i];
    const gx = plotLeft + i * groupW + (groupW - (barW * 2 + barGap)) / 2;

    // p95 bar
    const p95H = (p95 / yMax) * plotH;
    const p95Y = plotBottom - p95H;
    bars += `  <rect x="${gx.toFixed(1)}" y="${p95Y.toFixed(1)}" width="${barW}" height="${p95H.toFixed(1)}" fill="${COLORS.p95}" rx="2"/>\n`;
    if (p95 > 0) bars += `  <text x="${(gx + barW / 2).toFixed(1)}" y="${(p95Y - 3).toFixed(1)}" text-anchor="middle" font-size="9" fill="${COLORS.p95}">${p95}ms</text>\n`;

    // p99 bar
    const p99H = (p99 / yMax) * plotH;
    const p99Y = plotBottom - p99H;
    const p99X = gx + barW + barGap;
    bars += `  <rect x="${p99X.toFixed(1)}" y="${p99Y.toFixed(1)}" width="${barW}" height="${p99H.toFixed(1)}" fill="${COLORS.p99}" rx="2"/>\n`;
    if (p99 > 0) bars += `  <text x="${(p99X + barW / 2).toFixed(1)}" y="${(p99Y - 3).toFixed(1)}" text-anchor="middle" font-size="9" fill="${COLORS.p99}">${p99}ms</text>\n`;

    const labelX = plotLeft + i * groupW + groupW / 2;
    bars += `  <text x="${labelX.toFixed(1)}" y="${plotBottom + 16}" text-anchor="middle" font-size="10" fill="${COLORS.muted}">${esc(ep.name)}</text>\n`;
  });

  // 2s SMART objective line
  if (2000 <= yMax) {
    const smartY = plotBottom - (2000 / yMax) * plotH;
    bars += `  <line x1="${plotLeft}" y1="${smartY.toFixed(1)}" x2="${plotRight}" y2="${smartY.toFixed(1)}" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="6,4"/>\n`;
    bars += `  <text x="${plotRight + 4}" y="${(smartY + 4).toFixed(1)}" font-size="10" fill="#ef4444">2 s target</text>\n`;
  }

  const gridMax = Math.ceil(yMax / 500) * 500;
  const gridSteps = Array.from({ length: Math.floor(gridMax / 500) + 1 }, (_, i) => i * 500).filter((s) => s <= yMax);

  const totalReq = data.summary?.totalRequests ?? 0;
  const subtitle = `${data.profile} · ${totalReq} total requests · ${data.target} · ${data.collectedAt?.slice(0, 10) ?? ""}`;

  const content = `
  <text x="${W / 2}" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="${COLORS.title}">Load Test — Response Time Distribution (overall)</text>
  <text x="${W / 2}" y="45" text-anchor="middle" font-size="11" fill="${COLORS.muted}">${esc(subtitle)}</text>
${legend([
    { label: "p95", color: COLORS.p95 },
    { label: "p99", color: COLORS.p99 },
  ], 290, 68)}
${axes(plotLeft, plotRight, plotTop, plotBottom, "Response Time (ms)")}
${yGridlines(plotLeft, plotRight, plotTop, plotBottom, gridSteps, yMax)}
${bars}`;

  return svgWrap(W, H, content);
}

// ─── 4. Test Suite Summary ───────────────────────────────────────────────────

function generateTestSummaryChart(data) {
  const suites = data.suites.filter((s) => !s.error);
  const W = 760, H = 400;
  const plotLeft = 60, plotRight = 700, plotTop = 90, plotBottom = 300;
  const plotH = plotBottom - plotTop;
  const plotW = plotRight - plotLeft;

  const maxTests = Math.max(...suites.map((s) => s.tests), 10);
  const yMax = Math.ceil(maxTests / 50) * 50 || 50;

  const nGroups = suites.length;
  const groupW = plotW / nGroups;
  const barKeys = ["passed", "failed", "skipped"];
  const barW = 24;
  const barGap = 4;
  const groupBarW = barKeys.length * (barW + barGap) - barGap;

  let bars = "";
  suites.forEach((suite, gi) => {
    const gx = plotLeft + gi * groupW + (groupW - groupBarW) / 2;
    barKeys.forEach((key, bi) => {
      const val = suite[key] ?? 0;
      const bH = (val / yMax) * plotH;
      const x = gx + bi * (barW + barGap);
      const y = plotBottom - bH;
      bars += `  <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW}" height="${bH.toFixed(1)}" fill="${COLORS[key]}" rx="2"/>\n`;
      if (val > 0) {
        bars += `  <text x="${(x + barW / 2).toFixed(1)}" y="${(y - 3).toFixed(1)}" text-anchor="middle" font-size="9" fill="${COLORS[key]}">${val}</text>\n`;
      }
    });
    const labelX = plotLeft + gi * groupW + groupW / 2;
    bars += `  <text x="${labelX.toFixed(1)}" y="${plotBottom + 16}" text-anchor="middle" font-size="10" fill="${COLORS.muted}">${esc(suite.label)}</text>\n`;
    bars += `  <text x="${labelX.toFixed(1)}" y="${plotBottom + 29}" text-anchor="middle" font-size="9" fill="${COLORS.muted}">${suite.passRate}%</text>\n`;
  });

  const gridSteps = Array.from({ length: Math.floor(yMax / 50) + 1 }, (_, i) => i * 50);

  const overall = data.overall;
  const subtitle = `${overall.tests} total tests · ${overall.passed} passed · ${overall.passRate}% pass rate · ${data.collectedAt?.slice(0, 10) ?? ""}`;

  const content = `
  <text x="${W / 2}" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="${COLORS.title}">Test Suite Summary</text>
  <text x="${W / 2}" y="45" text-anchor="middle" font-size="11" fill="${COLORS.muted}">${esc(subtitle)}</text>
${legend([
    { label: "Passed", color: COLORS.passed },
    { label: "Failed", color: COLORS.failed },
    { label: "Skipped", color: COLORS.skipped },
  ], 240, 68)}
${axes(plotLeft, plotRight, plotTop, plotBottom, "Test Count")}
${yGridlines(plotLeft, plotRight, plotTop, plotBottom, gridSteps, yMax)}
${bars}`;

  return svgWrap(W, H, content);
}

// ─── 5. Server Test Breakdown ────────────────────────────────────────────────

function generateServerBreakdownChart(data) {
  const serverSuite = data.suites.find((s) => s.id === "server");
  if (!serverSuite || !serverSuite.files?.length) return null;

  const files = [...serverSuite.files].sort((a, b) => b.total - a.total);
  const W = 760;
  const ROW_H = 26;
  const TOP_PAD = 80;
  const BOT_PAD = 40;
  const H = TOP_PAD + files.length * ROW_H + BOT_PAD;
  const labelW = 260;
  const plotLeft = labelW + 10;
  const plotRight = 720;
  const plotW = plotRight - plotLeft;

  const maxVal = Math.max(...files.map((f) => f.total), 1);

  let rows = "";
  files.forEach((file, i) => {
    const y = TOP_PAD + i * ROW_H;
    const barW = (file.total / maxVal) * plotW;
    const passedW = (file.passed / maxVal) * plotW;
    const failedW = ((file.failed ?? 0) / maxVal) * plotW;

    // Label
    rows += `  <text x="${labelW}" y="${y + 16}" text-anchor="end" font-size="10" fill="${COLORS.text}">${esc(file.file.replace("__tests__/", "").replace(".test.js", "").replace(".test.ts", ""))}</text>\n`;
    // Passed segment
    if (passedW > 0) rows += `  <rect x="${plotLeft}" y="${y + 4}" width="${passedW.toFixed(1)}" height="18" fill="${COLORS.passed}" rx="2"/>\n`;
    // Failed segment
    if (failedW > 0) rows += `  <rect x="${(plotLeft + passedW).toFixed(1)}" y="${y + 4}" width="${failedW.toFixed(1)}" height="18" fill="${COLORS.failed}" rx="2"/>\n`;
    // Count label
    rows += `  <text x="${(plotLeft + barW + 6).toFixed(1)}" y="${y + 16}" font-size="10" fill="${COLORS.muted}">${file.total}</text>\n`;
    // Row separator
    rows += `  <line x1="0" y1="${y + ROW_H - 0.5}" x2="${W}" y2="${y + ROW_H - 0.5}" stroke="${COLORS.grid}" stroke-width="0.5"/>\n`;
  });

  const content = `
  <text x="${W / 2}" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="${COLORS.title}">Server Jest — Tests per File</text>
  <text x="${W / 2}" y="45" text-anchor="middle" font-size="11" fill="${COLORS.muted}">${serverSuite.suites} suites · ${serverSuite.tests} tests · ${serverSuite.passRate}% pass rate · ${data.collectedAt?.slice(0, 10) ?? ""}</text>
${legend([
    { label: "Passed", color: COLORS.passed },
    { label: "Failed", color: COLORS.failed },
  ], 290, 64)}
${rows}`;

  return svgWrap(W, H, content);
}

// ─── main ─────────────────────────────────────────────────────────────────────

function loadJson(name) {
  const p = path.join(OUTPUT_DIR, `${name}.json`);
  if (!fs.existsSync(p)) {
    console.warn(`[charts] Missing: ${p} — skipping related charts`);
    return null;
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function saveChart(name, svg) {
  if (!svg) return;
  fs.mkdirSync(CHARTS_DIR, { recursive: true });
  const outPath = path.join(CHARTS_DIR, `${name}.svg`);
  fs.writeFileSync(outPath, svg);
  console.log(`[charts] Saved → ${outPath}`);
}

function main() {
  const lighthouse = loadJson("lighthouse");
  const accessibility = loadJson("accessibility");
  const loadTest = loadJson("load-test");
  const testResults = loadJson("test-results");

  if (lighthouse) saveChart("lighthouse-scores", generateLighthouseChart(lighthouse));
  if (accessibility) saveChart("accessibility-violations", generateAccessibilityChart(accessibility));
  if (loadTest) saveChart("load-test-p95", generateLoadTestChart(loadTest));
  if (testResults) {
    saveChart("test-suite-summary", generateTestSummaryChart(testResults));
    const breakdown = generateServerBreakdownChart(testResults);
    if (breakdown) saveChart("test-server-breakdown", breakdown);
  }

  console.log("[charts] Done.");
}

main();
