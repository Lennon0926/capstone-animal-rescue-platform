import { test, expect } from "@playwright/test";

test.describe("About page (/about)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/about");
  });

  // --- Page load ---
  test("page loads with header and footer", async ({ page }) => {
    await expect(page).toHaveURL(/\/about/);
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });

  // --- Hero section ---
  test("hero tagline is visible", async ({ page }) => {
    await expect(page.getByText("Desde 1990 Protegiendo Vidas", { exact: true })).toBeVisible();
  });

  test("hero org name heading is visible", async ({ page }) => {
    // Scoped to the hero section (first section) to avoid matching the footer brand text
    await expect(
      page.locator("section").first().getByRole("heading", {
        name: "Ciudadanos Pro Albergue de Animales de Aguadilla",
        exact: true,
      })
    ).toBeVisible();
  });

  test("hero subtitle about volunteers is visible", async ({ page }) => {
    await expect(page.getByText(/grupo de voluntarios trabajando arduamente/i)).toBeVisible();
  });

  // --- Mission & Vision section ---
  test("Nuestra Razón de Ser section heading is visible", async ({ page }) => {
    const heading = page.getByRole("heading", { name: "Nuestra Razón de Ser", exact: true });
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible();
  });

  test("Nuestra Misión card heading and text are visible", async ({ page }) => {
    const heading = page.getByRole("heading", { name: "Nuestra Misión", exact: true });
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible();
    await expect(page.getByText(/programas de esterilización y educación/i)).toBeVisible();
  });

  test("Nuestra Visión card heading and text are visible", async ({ page }) => {
    const heading = page.getByRole("heading", { name: "Nuestra Visión", exact: true });
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible();
    await expect(page.getByText(/reducción significativa en el maltrato/i)).toBeVisible();
  });

  // --- Our Story section ---
  test("Nuestra Historia heading is visible", async ({ page }) => {
    const heading = page.getByRole("heading", { name: "Nuestra Historia", exact: true });
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible();
  });

  test("founding year 1990 is mentioned in story", async ({ page }) => {
    const el = page.getByText(/noviembre de 1990/i);
    await el.scrollIntoViewIfNeeded();
    await expect(el).toBeVisible();
  });

  test("30+ years highlight is visible", async ({ page }) => {
    const el = page.getByText(/Más de 30 años/i);
    await el.scrollIntoViewIfNeeded();
    await expect(el).toBeVisible();
  });

  // --- Values section ---
  test("Nuestros Valores heading is visible", async ({ page }) => {
    const heading = page.getByRole("heading", { name: "Nuestros Valores", exact: true });
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible();
  });

  test("all three values are visible (Protección, Compasión, Compromiso)", async ({ page }) => {
    for (const value of ["Protección", "Compasión", "Compromiso"] as const) {
      const el = page.getByRole("heading", { name: value, exact: true });
      await el.scrollIntoViewIfNeeded();
      await expect(el).toBeVisible();
    }
  });

  // --- Gallery section ---
  test("Nuestra Comunidad en Acción heading is visible", async ({ page }) => {
    const heading = page.getByRole("heading", { name: "Nuestra Comunidad en Acción", exact: true });
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible();
  });

  test("gallery images are rendered", async ({ page }) => {
    const img = page.getByAltText("Feria de Mascotas - Comunidad");
    await img.scrollIntoViewIfNeeded();
    await expect(img).toBeVisible();
  });

  // --- Team section ---
  test("Nuestro Equipo heading is visible", async ({ page }) => {
    const heading = page.getByRole("heading", { name: "Nuestro Equipo", exact: true });
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible();
  });

  test("all three team members are visible", async ({ page }) => {
    for (const name of ["Voluntarios CPAAA", "Hogares Temporeros", "Comunidad"] as const) {
      const el = page.getByRole("heading", { name, exact: true });
      await el.scrollIntoViewIfNeeded();
      await expect(el).toBeVisible();
    }
  });

  // --- Contact section ---
  test("Contáctenos heading is visible", async ({ page }) => {
    const heading = page.getByRole("heading", { name: "Contáctenos", exact: true });
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible();
  });

  test("phone link is present and correct", async ({ page }) => {
    const link = page.getByRole("link", { name: "787-505-8255", exact: true });
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "tel:787-505-8255");
  });

  test("email link is present and correct", async ({ page }) => {
    const link = page.getByRole("link", { name: "info@cpaaa.org", exact: true });
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "mailto:info@cpaaa.org");
  });

  test("postal address is visible", async ({ page }) => {
    // "Box 4152" only appears in the about contact section, not in the footer
    const address = page.locator("p").filter({ hasText: /Box 4152/ });
    await address.scrollIntoViewIfNeeded();
    await expect(address).toBeVisible();
    await expect(address).toContainText("Aguadilla, Puerto Rico 00605");
  });

  // --- Social links ---
  test("Facebook link is present", async ({ page }) => {
    const link = page.getByRole("link", { name: /Visita nuestra página de Facebook/i });
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", /facebook\.com/i);
  });

  // --- CTA section ---
  test("CTA heading is visible", async ({ page }) => {
    const heading = page.getByRole("heading", { name: "Tú También Puedes Hacer la Diferencia", exact: true });
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible();
  });

  test("CTA Ayúdanos a Ayudar link points to /donation", async ({ page }) => {
    const link = page.getByRole("link", { name: /Ayúdanos a Ayudar/i });
    await link.scrollIntoViewIfNeeded();
    await expect(link).toHaveAttribute("href", "/donation");
  });
});
