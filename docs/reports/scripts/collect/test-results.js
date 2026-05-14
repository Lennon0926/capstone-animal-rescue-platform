#!/usr/bin/env node
/**
 * Test results collector — runs Jest in both apps and captures JSON output.
 * These are unit/integration tests run locally regardless of deployed URL.
 *
 * Usage: node collect/test-results.js
 * Output: ../output/test-results.json
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..", "..", "..");

const SUITES = [
  {
    id: "server",
    label: "Server unit/integration",
    dir: path.join(REPO_ROOT, "apps", "server"),
    tool: "Jest",
  },
  {
    id: "web",
    label: "Web unit",
    dir: path.join(REPO_ROOT, "apps", "web"),
    tool: "Jest",
  },
];

function runJest(suiteDir) {
  const jestJsonPath = path.join(suiteDir, "jest-output.json");

  try {
    execSync(
      `npx jest --json --outputFile="${jestJsonPath}" --no-coverage --passWithNoTests`,
      {
        cwd: suiteDir,
        stdio: ["ignore", "ignore", "ignore"],
        timeout: 120_000,
      }
    );
  } catch {
    // Jest exits non-zero when tests fail — output file still written
  }

  if (!fs.existsSync(jestJsonPath)) {
    return null;
  }

  const raw = JSON.parse(fs.readFileSync(jestJsonPath, "utf8"));
  fs.unlinkSync(jestJsonPath);
  return raw;
}

function summariseSuite(raw, suiteMeta) {
  if (!raw) {
    return {
      id: suiteMeta.id,
      label: suiteMeta.label,
      tool: suiteMeta.tool,
      error: "Jest produced no output",
      suites: 0,
      tests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      passRate: 0,
      files: [],
    };
  }

  const files = (raw.testResults ?? []).map((r) => ({
    file: path.relative(suiteMeta.dir, r.testFilePath),
    passed: r.numPassingTests,
    failed: r.numFailingTests,
    skipped: r.numPendingTests,
    total: r.numPassingTests + r.numFailingTests + r.numPendingTests,
  }));

  const total = raw.numTotalTests ?? 0;
  const passed = raw.numPassedTests ?? 0;

  return {
    id: suiteMeta.id,
    label: suiteMeta.label,
    tool: suiteMeta.tool,
    suites: raw.numTotalTestSuites ?? 0,
    tests: total,
    passed,
    failed: raw.numFailedTests ?? 0,
    skipped: raw.numPendingTests ?? 0,
    passRate: total > 0 ? Math.round((passed / total) * 1000) / 10 : 0,
    files,
  };
}

async function main() {
  const outputDir = path.join(__dirname, "..", "output");
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`[tests] Repo root: ${REPO_ROOT}`);

  const results = [];

  for (const suite of SUITES) {
    if (!fs.existsSync(suite.dir)) {
      console.warn(`[tests] Directory not found, skipping: ${suite.dir}`);
      results.push({
        id: suite.id,
        label: suite.label,
        error: `Directory not found: ${suite.dir}`,
      });
      continue;
    }

    console.log(`[tests] Running ${suite.label} in ${suite.dir} ...`);
    const raw = runJest(suite.dir);
    const summary = summariseSuite(raw, suite);
    results.push(summary);
    console.log(
      `[tests]   Suites=${summary.suites} Tests=${summary.tests} ` +
        `Passed=${summary.passed} Failed=${summary.failed} Rate=${summary.passRate}%`
    );
  }

  const totalTests = results.reduce((s, r) => s + (r.tests ?? 0), 0);
  const totalPassed = results.reduce((s, r) => s + (r.passed ?? 0), 0);

  const output = {
    collectedAt: new Date().toISOString(),
    overall: {
      tests: totalTests,
      passed: totalPassed,
      failed: totalTests - totalPassed,
      passRate: totalTests > 0 ? Math.round((totalPassed / totalTests) * 1000) / 10 : 0,
    },
    suites: results,
  };

  const outFile = path.join(outputDir, "test-results.json");
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2));
  console.log(`[tests] Saved → ${outFile}`);
}

main().catch((err) => {
  console.error("[tests] Fatal:", err.message);
  process.exit(1);
});
