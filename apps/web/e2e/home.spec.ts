import { test, expect } from "@playwright/test";
import { MOBILE_BREAKPOINT, LANDING_PAGE_ANIMALS, ADOPTION_STEPS } from "./fixtures/testData";

test.describe("Home page (/home)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/home");
  });

  // --- Header & Navigation ---
  test("header renders with logo", async ({ page }) => {
    await expect(page.locator("header")).toBeVisible();
    await expect(page.getByAltText("CPAAA Logo")).toBeVisible();
  });

  test("desktop nav links are visible", async ({ page, viewport }) => {
    test.skip(!!viewport && viewport.width < MOBILE_BREAKPOINT, "Desktop only");
    const nav = page.locator("header nav");
    await expect(nav.getByRole("link", { name: "Home", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Adoptar", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "About", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Blog", exact: true })).toBeVisible();
    await expect(nav.getByRole("button", { name: "Donar", exact: true })).toBeVisible();
  });

  test("mobile hamburger opens nav", async ({ page, viewport }) => {
    test.skip(!viewport || viewport.width >= MOBILE_BREAKPOINT, "Mobile only");
    const menuButton = page.getByRole("button", { name: "Toggle Menu" });
    await expect(menuButton).toBeVisible();
    await menuButton.click();
    await expect(page.getByRole("link", { name: "Adoptar", exact: true })).toBeVisible();
  });

  // --- DonationSection (hero) ---
  test("hero heading is visible", async ({ page }) => {
    const heading = page.getByRole("heading", { name: /segunda oportunidad/i });
    await expect(heading).toBeVisible();
  });

  test("hero description text is visible", async ({ page }) => {
    await expect(page.getByText(/Ayudamos a animales abandonados/i)).toBeVisible();
  });

  test("hero Dona Ahora opens donation modal with first amount", async ({ page }) => {
    const button = page.getByRole("button", { name: "Dona Ahora", exact: true });
    await expect(button).toBeVisible();
    await button.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Donación — $10" })).toBeVisible();
  });

  // --- OurMissionSection ---
  test("mission heading is visible", async ({ page }) => {
    const heading = page.getByRole("heading", { name: "Nuestra Misión", exact: true });
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible();
  });

  test("mission text is visible", async ({ page }) => {
    const text = page.getByText(/organización sin fines de lucro/i);
    await text.scrollIntoViewIfNeeded();
    await expect(text).toBeVisible();
  });

  // --- AnimalsSection ---
  test("animals section heading is visible", async ({ page }) => {
    const heading = page.getByRole("heading", { name: "Conoce a Nuestros Animales", exact: true });
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible();
  });

  test("animal cards render from API", async ({ page }) => {
    for (const name of LANDING_PAGE_ANIMALS) {
      const card = page.getByRole("heading", { name, exact: true });
      await card.scrollIntoViewIfNeeded();
      await expect(card).toBeVisible();
    }
  });

  test("Ver Todos link navigates to /adopt", async ({ page }) => {
    const link = page.getByRole("link", { name: /Ver Todos/i });
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/adopt");
  });

  // --- HowItWorks ---
  test("adoption process heading is visible", async ({ page }) => {
    const heading = page.getByRole("heading", { name: "Proceso de Adopción", exact: true });
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible();
  });

  test("all three adoption steps are visible", async ({ page }) => {
    for (const step of ADOPTION_STEPS) {
      const el = page.getByRole("heading", { name: step, exact: true });
      await el.scrollIntoViewIfNeeded();
      await expect(el).toBeVisible();
    }
  });

  // --- DonationBanner ---
  test("donation banner heading is visible", async ({ page }) => {
    const heading = page.getByRole("heading", { name: "Ayúdanos a Salvar Más Vidas", exact: true });
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible();
  });

  test("donation banner Donar Ahora opens donation modal", async ({ page }) => {
    const button = page.getByRole("button", { name: "Donar Ahora", exact: true });
    await button.scrollIntoViewIfNeeded();
    await button.click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("donation banner benefits text is visible", async ({ page }) => {
    const el = page.getByText("100% destinado a los animales", { exact: true });
    await el.scrollIntoViewIfNeeded();
    await expect(el).toBeVisible();
  });

  // --- Footer ---
  test("footer renders with org name and contact info", async ({ page }) => {
    const footer = page.locator("footer");
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
    await expect(footer.getByText("Ciudadanos Pro Albergue de Animales de Aguadilla", { exact: true })).toBeVisible();
    await expect(footer.getByText("(787)-505-8255", { exact: true })).toBeVisible();
    await expect(footer.getByText("info@animalrescue.org", { exact: true })).toBeVisible();
  });

  test("footer quick links are present", async ({ page }) => {
    const footer = page.locator("footer");
    await footer.scrollIntoViewIfNeeded();
    await expect(footer.getByRole("link", { name: "Sobre Nosotros", exact: true })).toBeVisible();
    await expect(footer.getByRole("link", { name: "Animales Disponibles", exact: true })).toBeVisible();
    await expect(footer.getByRole("button", { name: "Donar", exact: true })).toBeVisible();
  });
});
