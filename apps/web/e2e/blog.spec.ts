import { test, expect } from "@playwright/test";

test.describe("Blog page (/blog)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/blog");
  });

  test("page loads without errors", async ({ page }) => {
    await expect(page).toHaveURL(/\/blog/);
  });

  test("blog heading is visible", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Blog", exact: true })).toBeVisible();
  });

  test("header is visible", async ({ page }) => {
    await expect(page.locator("header")).toBeVisible();
  });

  test("footer is visible", async ({ page }) => {
    await expect(page.locator("footer")).toBeVisible();
  });
});
