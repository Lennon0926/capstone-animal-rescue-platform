/**
 * accessibility.spec.ts
 * WCAG 2.1 Level AA audit — Issue #114, SMART Objective 5
 *
 * Pages:
 *   /home           Landing page (index.tsx redirects → /home)
 *   /adopt          Animal listing
 *   /adopt/1        Animal detail (Fluffy, aid=1 from mock server)
 *   /admin/animals  Admin dashboard
 *
 * Run: npx playwright test e2e/accessibility.spec.ts --project="Desktop Chrome" --reporter=list
 */

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { MOCK_ANIMALS } from "./fixtures/testData";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

type ImpactLevel = "critical" | "serious" | "moderate" | "minor";
const IMPACT_ORDER: ImpactLevel[] = ["critical", "serious", "moderate", "minor"];

interface AxeViolation {
  id: string;
  impact: string | null;
  description: string;
  helpUrl: string;
  nodes: Array<{ target: string[]; html?: string; failureSummary?: string }>;
}

interface ViolationCounts {
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  total: number;
}

function countByImpact(violations: AxeViolation[]): ViolationCounts {
  const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const v of violations) {
    const level = (v.impact ?? "minor") as ImpactLevel;
    if (level in counts) counts[level as keyof typeof counts]++;
  }
  return { ...counts, total: violations.length };
}

function printViolations(pageName: string, violations: AxeViolation[]) {
  const counts = countByImpact(violations);
  console.log(`\n${"─".repeat(60)}`);
  console.log(`Accessibility Audit: ${pageName}`);
  console.log(
    `  Critical: ${counts.critical}  Serious: ${counts.serious}  ` +
      `Moderate: ${counts.moderate}  Minor: ${counts.minor}  Total: ${counts.total}`
  );
  if (counts.total === 0) {
    console.log("  ✓ No violations found.");
    return;
  }
  for (const impact of IMPACT_ORDER) {
    const group = violations.filter((v) => v.impact === impact);
    if (group.length === 0) continue;
    console.log(`\n  [${impact.toUpperCase()}]`);
    for (const v of group) {
      const selectors = v.nodes.flatMap((n) => n.target).slice(0, 3);
      console.log(`  • ${v.id}: ${v.description}`);
      console.log(`    Selectors: ${selectors.join(" | ")}`);
      console.log(`    Help: ${v.helpUrl}`);
    }
  }
  console.log();
}

// ─────────────────────────────────────────────────────────
// Landing Page — /home
// ─────────────────────────────────────────────────────────
test.describe("Accessibility — Landing Page (/home)", () => {
  test("WCAG 2.1 AA audit", async ({ page }) => {
    await page.goto("/home", { waitUntil: "networkidle" });

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    const violations = results.violations as AxeViolation[];

    printViolations("/home", violations);
    test.info().annotations.push({
      type: "a11y",
      description: JSON.stringify(countByImpact(violations)),
    });

    const criticalCount = violations.filter((v) => v.impact === "critical").length;
    expect(criticalCount, "No Critical violations on /home").toBe(0);
  });
});

// ─────────────────────────────────────────────────────────
// Adopt Listing — /adopt
// ─────────────────────────────────────────────────────────
test.describe("Accessibility — Adopt Page (/adopt)", () => {
  test("WCAG 2.1 AA audit", async ({ page }) => {
    await page.goto("/adopt", { waitUntil: "networkidle" });

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    const violations = results.violations as AxeViolation[];

    printViolations("/adopt", violations);
    test.info().annotations.push({
      type: "a11y",
      description: JSON.stringify(countByImpact(violations)),
    });

    const criticalCount = violations.filter((v) => v.impact === "critical").length;
    expect(criticalCount, "No Critical violations on /adopt").toBe(0);
  });
});

// ─────────────────────────────────────────────────────────
// Animal Detail — /adopt/[id]  (Fluffy, aid=1)
// ─────────────────────────────────────────────────────────
test.describe("Accessibility — Animal Detail (/adopt/[id])", () => {
  test("WCAG 2.1 AA audit", async ({ page }) => {
    const { aid } = MOCK_ANIMALS[0]; // Fluffy
    await page.goto(`/adopt/${aid}`, { waitUntil: "networkidle" });

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    const violations = results.violations as AxeViolation[];

    printViolations(`/adopt/${aid}`, violations);
    test.info().annotations.push({
      type: "a11y",
      description: JSON.stringify(countByImpact(violations)),
    });

    const criticalCount = violations.filter((v) => v.impact === "critical").length;
    expect(criticalCount, `No Critical violations on /adopt/${aid}`).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────
// Admin Dashboard — /admin/animals
// ─────────────────────────────────────────────────────────
test.describe("Accessibility — Admin Dashboard (/admin/animals)", () => {
  test("WCAG 2.1 AA audit", async ({ page }) => {
    await page.goto("/admin/animals", { waitUntil: "networkidle" });

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    const violations = results.violations as AxeViolation[];

    printViolations("/admin/animals", violations);
    test.info().annotations.push({
      type: "a11y",
      description: JSON.stringify(countByImpact(violations)),
    });

    const criticalCount = violations.filter((v) => v.impact === "critical").length;
    expect(criticalCount, "No Critical violations on /admin/animals").toBe(0);
  });
});
