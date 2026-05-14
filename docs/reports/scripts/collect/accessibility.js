#!/usr/bin/env node
/**
 * Accessibility audit collector — WCAG 2.1 AA via pa11y + axe-core.
 *
 * Usage: node collect/accessibility.js <web-base-url>
 * Output: ../output/accessibility.json
 */

"use strict";

const fs = require("fs");
const path = require("path");
const pa11y = require("pa11y");

const PAGES = [
  { name: "Home", path: "/home" },
  { name: "Adopt Listing", path: "/adopt" },
  { name: "Animal Detail", path: "/adopt/1" },
  { name: "About", path: "/about" },
  { name: "Blog", path: "/blog" },
];

const PA11Y_OPTIONS = {
  standard: "WCAG2AA",
  runners: ["axe"],
  includeWarnings: true,
  chromeLaunchConfig: {
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  },
  // Give dynamic content time to load
  wait: 1500,
  timeout: 30000,
};

/** Map pa11y type to WCAG impact level */
function resolveImpact(issue) {
  if (issue.type === "error") return "serious";
  if (issue.runnerExtras?.impact) return issue.runnerExtras.impact;
  return issue.type === "warning" ? "moderate" : "minor";
}

function countByImpact(issues) {
  const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const issue of issues) {
    const level = resolveImpact(issue);
    if (level in counts) counts[level]++;
  }
  return counts;
}

async function main() {
  const baseUrl = process.argv[2];
  if (!baseUrl) {
    console.error("Usage: node collect/accessibility.js <web-base-url>");
    process.exit(1);
  }

  const outputDir = path.join(__dirname, "..", "output");
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`[a11y] Target: ${baseUrl}`);
  console.log(`[a11y] Standard: WCAG2AA via axe-core`);

  const pageResults = [];

  for (const page of PAGES) {
    const url = `${baseUrl.replace(/\/$/, "")}${page.path}`;
    console.log(`[a11y] Auditing ${url} ...`);

    try {
      const result = await pa11y(url, PA11Y_OPTIONS);
      const counts = countByImpact(result.issues);
      const total = result.issues.length;

      pageResults.push({
        pageName: page.name,
        url,
        counts,
        total,
        issues: result.issues.map((issue) => ({
          type: issue.type,
          impact: resolveImpact(issue),
          code: issue.code,
          message: issue.message,
          selector: issue.selector,
          context: issue.context,
        })),
      });

      console.log(
        `[a11y]   Critical=${counts.critical} Serious=${counts.serious} ` +
          `Moderate=${counts.moderate} Minor=${counts.minor} Total=${total}`
      );
    } catch (err) {
      console.error(`[a11y]   Error on ${url}: ${err.message}`);
      pageResults.push({
        pageName: page.name,
        url,
        error: err.message,
        counts: { critical: 0, serious: 0, moderate: 0, minor: 0 },
        total: 0,
        issues: [],
      });
    }
  }

  const output = {
    tool: "pa11y + axe-core",
    standard: "WCAG 2.1 Level AA",
    collectedAt: new Date().toISOString(),
    target: baseUrl,
    pages: pageResults,
  };

  const outFile = path.join(outputDir, "accessibility.json");
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2));
  console.log(`[a11y] Saved → ${outFile}`);
}

main().catch((err) => {
  console.error("[a11y] Fatal:", err.message);
  process.exit(1);
});
