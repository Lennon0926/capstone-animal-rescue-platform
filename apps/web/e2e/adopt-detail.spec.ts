import { test, expect } from "@playwright/test";
import { MOCK_ANIMALS } from "./fixtures/testData";

const fluffy = MOCK_ANIMALS[0];

test.describe("Animal detail page (/adopt/[id])", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/adopt/${fluffy.aid}`, {
      waitUntil: "domcontentloaded",
    });
  });

  // --- Page load ---
  test("page loads with header and footer for valid animal", async ({ page }) => {
    await expect(page).toHaveURL(new RegExp(`/adopt/${fluffy.aid}`));
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });

  // --- Animal identity ---
  test("animal name is shown as h1", async ({ page }) => {
    await expect(page.getByRole("heading", { name: fluffy.name, level: 1, exact: true })).toBeVisible();
  });

  test("status badge shows Disponible", async ({ page }) => {
    // exact: true prevents matching "Animales Disponibles" in the footer nav
    await expect(page.getByText("Disponible", { exact: true })).toBeVisible();
  });

  // --- Animal metadata ---
  test("species label and value are displayed", async ({ page }) => {
    const meta = page.locator("p").filter({ hasText: /Especie:/i });
    await expect(meta).toBeVisible();
    await expect(meta).toContainText("Dog");
  });

  test("size label and value are displayed", async ({ page }) => {
    const meta = page.locator("p").filter({ hasText: /Tamaño:/i });
    await expect(meta).toBeVisible();
    await expect(meta).toContainText("Medium");
  });

  test("gender label and value are displayed", async ({ page }) => {
    const meta = page.locator("p").filter({ hasText: /Género:/i });
    await expect(meta).toBeVisible();
    await expect(meta).toContainText("Male");
  });

  // --- Description ---
  test("description is displayed", async ({ page }) => {
    await expect(page.getByText(fluffy.description, { exact: true })).toBeVisible();
  });

  // --- Tags ---
  test("tags section is visible with correct tags", async ({ page }) => {
    await expect(page.getByText(/Etiquetas:/i)).toBeVisible();
    for (const tag of fluffy.tags) {
      await expect(page.getByText(tag, { exact: true })).toBeVisible();
    }
  });

  // --- Navigation ---
  test("back link navigates to /adopt", async ({ page }) => {
    const backLink = page.getByRole("link", { name: /Volver a Animales/i });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/adopt");
  });

  test("shows adoption unavailable message when form URL is not configured", async ({ page }) => {
    // NEXT_PUBLIC_GOOGLE_FORM_URL is not set in the test environment,
    // so the fallback message should appear instead of the Google Form link.
    await expect(page.getByText(/El formulario de adopción no está disponible/i)).toBeVisible();
  });

  // --- Error state ---
  test("shows error message for invalid animal ID", async ({ page }) => {
    await page.goto("/adopt/99999");
    await expect(page.getByText(/No se encontró el animal/i)).toBeVisible();
  });
});
