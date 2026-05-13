import { test, expect } from "@playwright/test";
import { MOCK_ANIMALS } from "./fixtures/testData";

const fluffy = MOCK_ANIMALS[0];
const max = MOCK_ANIMALS[1];
const animal3 = MOCK_ANIMALS[2];

test.describe("Adopt listing page (/adopt)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/adopt");
    // /adopt now opens on the AI Pet Match stage; skip into the standard
    // listing so the rest of the suite tests the flip-card grid.
    await page
      .getByRole("button", { name: "Ver todos los animales" })
      .first()
      .click();
    await expect(
      page.getByPlaceholder("Buscar animales..."),
    ).toBeVisible();
  });

  // --- Page load ---
  test("page loads with header and footer", async ({ page }) => {
    await expect(page).toHaveURL(/\/adopt/);
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });

  // --- AI Pet Match initial stage ---
  test("AI Pet Match stage is the initial view on /adopt", async ({
    page,
  }) => {
    // We're already in the listing because of beforeEach. Reload and re-check.
    await page.goto("/adopt");
    await expect(
      page.getByRole("heading", { name: /Encuentra a tu compañero ideal/i }),
    ).toBeVisible();
    await expect(
      page.getByPlaceholder(/perro mediano y tranquilo/i),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Ver todos los animales" }),
    ).toBeVisible();
  });

  // --- Search bar ---
  test("search bar is visible with correct placeholder", async ({ page }) => {
    await expect(page.getByPlaceholder("Buscar animales...")).toBeVisible();
  });

  // --- Animal cards ---
  test("animal flip cards are rendered (12 on first page)", async ({ page }) => {
    const cards = page.getByRole("button", { name: /Ver información de/i });
    await expect(cards.first()).toBeVisible();
    // 13 mock animals, ITEMS_PER_PAGE=12, so first page shows 12
    await expect(cards).toHaveCount(12);
  });

  // --- Search filtering ---
  test("search by name shows only matching animal", async ({ page }) => {
    await page.getByPlaceholder("Buscar animales...").fill(fluffy.name);
    await expect(page.getByRole("button", { name: `Ver información de ${fluffy.name}` })).toBeVisible();
    await expect(page.getByRole("button", { name: `Ver información de ${max.name}` })).not.toBeVisible();
  });

  test("search by species filters correctly", async ({ page }) => {
    // max is a cat; fluffy is a dog
    await page.getByPlaceholder("Buscar animales...").fill(max.species);
    await expect(page.getByRole("button", { name: `Ver información de ${max.name}` })).toBeVisible();
    await expect(page.getByRole("button", { name: `Ver información de ${fluffy.name}` })).not.toBeVisible();
  });

  test("empty state appears when search matches nothing", async ({ page }) => {
    await page.getByPlaceholder("Buscar animales...").fill("zzznonexistent");
    await expect(page.getByText("No se encontraron animales")).toBeVisible();
  });

  // --- Tag filters ---
  test("filter tags are rendered from animal data", async ({ page }) => {
    await expect(page.getByRole("button", { name: "dog", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "cat", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "vaccinated", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "friendly", exact: true })).toBeVisible();
  });

  test("single tag filter hides non-matching animals", async ({ page }) => {
    // Only fluffy has "vaccinated" tag
    await page.getByRole("button", { name: "vaccinated", exact: true }).click();
    await expect(page.getByRole("button", { name: `Ver información de ${fluffy.name}` })).toBeVisible();
    await expect(page.getByRole("button", { name: `Ver información de ${max.name}` })).not.toBeVisible();
  });

  test("multi-filter AND logic: dog + vaccinated shows only fluffy", async ({ page }) => {
    await page.getByRole("button", { name: "dog", exact: true }).click();
    await page.getByRole("button", { name: "vaccinated", exact: true }).click();
    // fluffy: species=dog, tags=[vaccinated, friendly] → matches both
    await expect(page.getByRole("button", { name: `Ver información de ${fluffy.name}` })).toBeVisible();
    // animal3 is a dog but has no vaccinated tag → filtered out
    await expect(page.getByRole("button", { name: `Ver información de ${animal3.name}` })).not.toBeVisible();
  });

  test("deselecting a filter restores all animals", async ({ page }) => {
    await page.getByRole("button", { name: "vaccinated", exact: true }).click();
    await page.getByRole("button", { name: "vaccinated", exact: true }).click(); // deselect
    await expect(page.getByRole("button", { name: /Ver información de/i })).toHaveCount(12);
  });

  // --- Pagination ---
  test("Load More button appears when animals exceed 12", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Cargar Más/i })).toBeVisible();
  });

  test("Load More loads all remaining animals", async ({ page }) => {
    await page.getByRole("button", { name: /Cargar Más/i }).click();
    await expect(page.getByRole("button", { name: /Ver información de/i })).toHaveCount(MOCK_ANIMALS.length);
  });

  test("Load More button disappears after all animals are loaded", async ({ page }) => {
    await page.getByRole("button", { name: /Cargar Más/i }).click();
    await expect(page.getByRole("button", { name: /Cargar Más/i })).not.toBeVisible();
  });

  // --- Card navigation ---
  test("flipping a card and clicking Conocer Más navigates to detail page", async ({ page }) => {
    await page.getByRole("button", { name: `Ver información de ${fluffy.name}` }).click();
    // After flip, the back face of the first card is visible; other cards are unflipped.
    // .first() is intentional: only the flipped card's link is in a visible card face.
    await page.getByRole("link", { name: "Conocer Más" }).first().click();
    await expect(page).toHaveURL(new RegExp(`/adopt/${fluffy.aid}`));
  });
});
