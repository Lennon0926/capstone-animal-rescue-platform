import { test, expect } from "@playwright/test";

test.describe("Donation page (/donation)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/donation");
  });

  test("page loads without errors", async ({ page }) => {
    await expect(page).toHaveURL(/\/donation/);
  });

  test("main donation messaging renders", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /Ayudanos a Salvar\s*Mas Vidas/i })
    ).toBeVisible();
  });

  test("donation tiers are visible", async ({ page }) => {
    await expect(page.getByText("$10", { exact: true })).toBeVisible();
    await expect(page.getByText("$25", { exact: true })).toBeVisible();
    await expect(page.getByText("$50", { exact: true })).toBeVisible();
  });

  test("payment CTAs are visible", async ({ page }) => {
    const paypalLink = page.getByRole("link", { name: "Donar con PayPal" });
    const stripeLink = page.getByRole("link", {
      name: "Stripe (proximamente)",
    });

    await expect(paypalLink).toBeVisible();
    await expect(paypalLink).toHaveAttribute("href", /paypal\.com\/donate/);

    await expect(stripeLink).toBeVisible();
    await expect(stripeLink).toHaveAttribute("href", /stripe\.com/);
  });

  test("impact and goal tracker are visible", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Como ayuda tu donacion" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Meta mensual de apoyo" })
    ).toBeVisible();
    await expect(page.getByText("$1,250 de $2,000")).toBeVisible();
  });

  test("header and footer are visible", async ({ page }) => {
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });
});
