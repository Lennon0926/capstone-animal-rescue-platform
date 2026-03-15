import { test, expect } from "@playwright/test";

test.describe("Donation page (/donation)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/donation");
  });

  test("page loads without errors", async ({ page }) => {
    await expect(page).toHaveURL(/\/donation/);
  });

  test("donation heading is visible", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Donation Page", exact: true })).toBeVisible();
  });

  test("header is visible", async ({ page }) => {
    await expect(page.locator("header")).toBeVisible();
  });

  test("footer is visible", async ({ page }) => {
    await expect(page.locator("footer")).toBeVisible();
  });
});
