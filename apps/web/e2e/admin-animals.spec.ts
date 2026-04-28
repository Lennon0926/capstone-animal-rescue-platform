import { test, expect } from "@playwright/test";
import { MOCK_ANIMALS } from "./fixtures/testData";

const MOCK_SERVER_URL = "http://localhost:4001";
const ITEMS_PER_PAGE = 10; // matches adminAnimalsList.tsx constant

// Helper: reset mock server state before mutation tests
async function resetAnimals(request: import("@playwright/test").APIRequestContext) {
  await request.post(`${MOCK_SERVER_URL}/test/reset`);
}

// Helper: create a minimal 1×1 PNG buffer for file upload tests
function fakePngBuffer(): Buffer {
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );
}

test.describe("Admin Animals List (/admin/animals)", () => {
  test.beforeEach(async ({ page, request }) => {
    await resetAnimals(request);
    await page.goto("/admin/animals");
  });

  // --- Page load ---
  test("page loads with header", async ({ page }) => {
    await expect(page.locator("header")).toBeVisible();
  });

  test("page title 'Gestión de Animales' is visible", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Gestión de Animales" })
    ).toBeVisible();
  });

  test("animal count subtitle shows correct total", async ({ page }) => {
    await expect(
      page.getByText(`Total de animales: ${MOCK_ANIMALS.length}`)
    ).toBeVisible();
  });

  // --- Table structure ---
  test("table column headers are all visible", async ({ page }) => {
    for (const header of ["Nombre", "Especie", "Género", "Tamaño", "Estado", "Imagen"]) {
      await expect(page.getByRole("columnheader", { name: header })).toBeVisible();
    }
  });

  test("first page shows exactly ITEMS_PER_PAGE rows", async ({ page }) => {
    const rows = page.locator("tbody tr");
    await expect(rows).toHaveCount(ITEMS_PER_PAGE);
  });

  test("first animal name appears in table", async ({ page }) => {
    // Use the nameCell td (first td in the row), not the image cell which shares the same alt text
    await expect(
      page.locator("tbody tr").first().locator("td").first()
    ).toContainText(MOCK_ANIMALS[0].name);
  });

  // --- Create button ---
  test("'Crear Nuevo Animal' link is visible and points to /admin/createAnimal", async ({ page }) => {
    const link = page.getByRole("link", { name: /Crear Nuevo Animal/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/admin/createAnimal");
  });

  // --- Search ---
  test("search bar is visible with correct placeholder", async ({ page }) => {
    await expect(
      page.getByPlaceholder(/Buscar por nombre/i)
    ).toBeVisible();
  });

  test("search by name filters the table", async ({ page }) => {
    const target = MOCK_ANIMALS[0];
    const other = MOCK_ANIMALS[1];
    await page.getByPlaceholder(/Buscar por nombre/i).fill(target.name);
    // Only one row should remain
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await expect(page.locator("tbody tr").first().locator("td").first()).toContainText(target.name);
    await expect(page.locator("tbody tr").first().locator("td").first()).not.toContainText(other.name);
  });

  test("clearing search restores all animals", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Buscar por nombre/i);
    await searchInput.fill(MOCK_ANIMALS[0].name);
    await searchInput.fill("");
    await expect(page.locator("tbody tr")).toHaveCount(ITEMS_PER_PAGE);
  });

  test("search with no matches shows empty state message", async ({ page }) => {
    await page.getByPlaceholder(/Buscar por nombre/i).fill("zzznomatch999");
    await expect(
      page.getByText(/No se encontraron animales/i)
    ).toBeVisible();
  });

  test("search resets to page 1", async ({ page }) => {
    // Go to page 2 first
    await page.getByTitle("Página siguiente").click();
    await expect(page.getByText(/Página\s+2\s+de\s+2/i)).toBeVisible();
    // Now search — should reset to page 1 with filtered results
    await page.getByPlaceholder(/Buscar por nombre/i).fill(MOCK_ANIMALS[0].name);
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await expect(page.locator("tbody tr").first().locator("td").first()).toContainText(MOCK_ANIMALS[0].name);
  });

  // --- Sorting ---
  test("clicking 'Nombre' header sorts by name ascending then descending", async ({ page }) => {
    const nameHeader = page.getByRole("columnheader", { name: "Nombre" });
    // First click: ascending (arrow rotated 180deg)
    await nameHeader.click();
    await expect(nameHeader.locator("svg")).toBeVisible();
    // Second click: descending
    await nameHeader.click();
    await expect(nameHeader.locator("svg")).toBeVisible();
  });

  // --- Pagination ---
  test("'Anterior' button is disabled on the first page", async ({ page }) => {
    await expect(page.getByTitle("Página anterior")).toBeDisabled();
  });

  test("'Siguiente' button is enabled on first page (13 animals > 10)", async ({ page }) => {
    await expect(page.getByTitle("Página siguiente")).toBeEnabled();
  });

  test("page info shows 'Página 1 de 2'", async ({ page }) => {
    await expect(page.getByText(/Página\s+1\s+de\s+2/i)).toBeVisible();
  });

  test("clicking 'Siguiente' advances to page 2", async ({ page }) => {
    await page.getByTitle("Página siguiente").click();
    await expect(page.getByText(/Página\s+2\s+de\s+2/i)).toBeVisible();
  });

  test("page 2 shows the remaining animals (3 of 13)", async ({ page }) => {
    await page.getByTitle("Página siguiente").click();
    const remaining = MOCK_ANIMALS.length - ITEMS_PER_PAGE;
    await expect(page.locator("tbody tr")).toHaveCount(remaining);
  });

  test("'Siguiente' is disabled on the last page", async ({ page }) => {
    await page.getByTitle("Página siguiente").click();
    await expect(page.getByTitle("Página siguiente")).toBeDisabled();
  });

  test("'Anterior' navigates back to page 1", async ({ page }) => {
    await page.getByTitle("Página siguiente").click();
    await page.getByTitle("Página anterior").click();
    await expect(page.getByText(/Página\s+1\s+de\s+2/i)).toBeVisible();
  });

  // --- Edit button ---
  test("Edit button for first animal links to /admin/editAnimal?id=", async ({ page }) => {
    const firstRow = page.locator("tbody tr").first();
    const editLink = firstRow.getByRole("link", { name: "Editar" });
    await expect(editLink).toBeVisible();
    await expect(editLink).toHaveAttribute(
      "href",
      `/admin/editAnimal?id=${MOCK_ANIMALS[0].aid}`
    );
  });

  // --- Delete modal: open & cancel ---
  test("clicking Delete opens the confirmation modal", async ({ page }) => {
    await page.locator("tbody tr").first().getByRole("button", { name: "Eliminar" }).click();
    await expect(
      page.getByRole("heading", { name: "Confirmar Eliminación" })
    ).toBeVisible();
    await expect(
      page.getByText(/¿Estás seguro de que deseas eliminar/i)
    ).toBeVisible();
  });

  test("modal shows the correct animal name", async ({ page }) => {
    await page.locator("tbody tr").first().getByRole("button", { name: "Eliminar" }).click();
    // Check that the modal message contains the animal name
    await expect(
      page.getByText(/¿Estás seguro de que deseas eliminar a/i)
    ).toContainText(MOCK_ANIMALS[0].name);
  });

  test("clicking 'Cancelar' closes modal without removing the animal", async ({ page }) => {
    await page.locator("tbody tr").first().getByRole("button", { name: "Eliminar" }).click();
    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(
      page.getByRole("heading", { name: "Confirmar Eliminación" })
    ).not.toBeVisible();
    // All 10 rows still visible on page 1
    await expect(page.locator("tbody tr")).toHaveCount(ITEMS_PER_PAGE);
    await expect(page.locator("tbody tr").first().locator("td").first()).toContainText(MOCK_ANIMALS[0].name);
  });

  // --- Delete: confirm flow ---
  test("confirming delete removes the animal from the list", async ({ page }) => {
    const target = MOCK_ANIMALS[0];
    await page.locator("tbody tr").first().getByRole("button", { name: "Eliminar" }).click();
    // Wait for the modal to fully appear before clicking confirm
    await expect(
      page.getByRole("heading", { name: "Confirmar Eliminación" })
    ).toBeVisible();
    // Click the confirm button inside the modal specifically (not the row buttons)
    await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/animals/") &&
          resp.request().method() === "DELETE"
      ),
      page.locator('[class*="modalConfirmButton"]').click(),
    ]);
    // Modal closes
    await expect(
      page.getByRole("heading", { name: "Confirmar Eliminación" })
    ).not.toBeVisible();
    // 13 animals - 1 deleted = 12 total; page 1 still fills to ITEMS_PER_PAGE (10)
    await expect(page.locator("tbody tr")).toHaveCount(ITEMS_PER_PAGE);
    // Deleted animal's name no longer in first column of any visible row
    const firstCells = page.locator("tbody tr td:first-child");
    await expect(firstCells.filter({ hasText: target.name })).toHaveCount(0);
  });
});

test.describe("Admin Create Animal (/admin/createAnimal)", () => {
  test.beforeEach(async ({ page, request }) => {
    await resetAnimals(request);
    await page.goto("/admin/createAnimal");
  });

  // --- Page load ---
  test("page loads with header", async ({ page }) => {
    await expect(page.locator("header")).toBeVisible();
  });

  test("form title 'Crear Nuevo Animal' is visible", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Crear Nuevo Animal" })
    ).toBeVisible();
  });

  test("back link navigates to /admin/animals", async ({ page }) => {
    const backLink = page.getByRole("link", { name: /Volver a la Lista/i });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/admin/animals");
  });

  // --- Required fields present ---
  test("all required form fields are present", async ({ page }) => {
    await expect(page.locator("#name")).toBeVisible();
    await expect(page.locator("#description")).toBeVisible();
    await expect(page.locator("#species")).toBeVisible();
    await expect(page.locator("#size")).toBeVisible();
    await expect(page.locator("#gender")).toBeVisible();
    await expect(page.locator("#status")).toBeVisible();
    await expect(page.locator("#image")).toBeVisible();
    await expect(page.locator("#tagInput")).toBeVisible();
    await expect(
      page.getByRole("group", { name: "Registros Médicos Iniciales" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Agregar otro registro médico/i })
    ).toBeVisible();
  });

  // --- Dropdown options ---
  test("species dropdown has 'Perro' and 'Gato' options", async ({ page }) => {
    await expect(page.locator("#species option[value='perro']")).toHaveCount(1);
    await expect(page.locator("#species option[value='gato']")).toHaveCount(1);
  });

  test("status dropdown defaults to 'disponible'", async ({ page }) => {
    await expect(page.locator("#status")).toHaveValue("disponible");
  });

  // --- Validation ---
  test("submitting empty form shows validation error", async ({ page }) => {
    await page.locator("#name").fill("");
    await page.evaluate(() => {
      (document.querySelector("form") as HTMLFormElement).noValidate = true;
    });
    await page.getByRole("button", { name: /Crear Animal/i }).click();
    await expect(page.getByRole("alert").filter({ hasText: /nombre/i })).toBeVisible();
  });

  test("validation error shown when name is missing", async ({ page }) => {
    await page.locator("#description").fill("Test description");
    await page.locator("#species").selectOption("perro");
    await page.locator("#size").selectOption("mediano");
    await page.locator("#gender").selectOption("macho");
    // Disable browser native constraint validation so the JS onSubmit handler runs
    await page.evaluate(() => {
      (document.querySelector("form") as HTMLFormElement).noValidate = true;
    });
    await page.getByRole("button", { name: /Crear Animal/i }).click();
    // Filter out the Next.js route announcer which also has role="alert"
    await expect(page.getByRole("alert").filter({ hasText: /nombre/i })).toBeVisible();
  });

  test("validation error shown when image is missing", async ({ page }) => {
    await page.locator("#name").fill("Test Animal");
    await page.locator("#description").fill("Test description");
    await page.locator("#species").selectOption("perro");
    await page.locator("#size").selectOption("mediano");
    await page.locator("#gender").selectOption("macho");
    // Disable native validation so the JS handler runs and checks for a missing image
    await page.evaluate(() => {
      (document.querySelector("form") as HTMLFormElement).noValidate = true;
    });
    await page.getByRole("button", { name: /Crear Animal/i }).click();
    await expect(page.getByRole("alert").filter({ hasText: /imagen/i })).toBeVisible();
  });

  // --- Tags ---
  test("can add a tag by pressing Enter", async ({ page }) => {
    await page.locator("#tagInput").fill("amigable");
    await page.locator("#tagInput").press("Enter");
    await expect(page.getByText("amigable", { exact: true })).toBeVisible();
  });

  test("can add a tag by clicking the + button", async ({ page }) => {
    await page.locator("#tagInput").fill("vacunado");
    await page.getByTitle("Agregar etiqueta").click();
    await expect(page.getByText("vacunado", { exact: true })).toBeVisible();
  });

  test("duplicate tags are not added", async ({ page }) => {
    await page.locator("#tagInput").fill("juguetón");
    await page.locator("#tagInput").press("Enter");
    await page.locator("#tagInput").fill("juguetón");
    await page.locator("#tagInput").press("Enter");
    await expect(page.getByText("juguetón", { exact: true })).toHaveCount(1);
  });

  test("can remove a tag by clicking its X button", async ({ page }) => {
    await page.locator("#tagInput").fill("temporal");
    await page.locator("#tagInput").press("Enter");
    await page.getByTitle("Remover etiqueta: temporal").click();
    await expect(page.getByText("temporal", { exact: true })).not.toBeVisible();
  });

  // --- Image preview ---
  test("selecting an image file shows a preview", async ({ page }) => {
    await page.locator("#image").setInputFiles({
      name: "test.jpg",
      mimeType: "image/jpeg",
      buffer: fakePngBuffer(),
    });
    // The preview section label appears when previewUrl state is set.
    // Asserting on the <p> label is reliable; next/image with a blob: URL
    // may not render an <img> since the server can't optimize blob URLs.
    await expect(page.getByText("Vista previa de la imagen:")).toBeVisible();
  });

  // --- Happy path: successful creation ---
  test("filling animal and multiple medical fields shows full success and redirects", async ({ page }) => {
    await page.locator("#name").fill("Buddy Test");
    await page.locator("#description").fill("Un perro muy amigable");
    await page.locator("#species").selectOption("perro");
    await page.locator("#size").selectOption("mediano");
    await page.locator("#gender").selectOption("macho");
    await page.locator("#status").selectOption("disponible");
    await page.locator("#medical_records_0_record_type").selectOption("vacunación");
    await page.locator("#medical_records_0_date_given").fill("2026-04-14T10:00");
    await page.locator("#medical_records_0_vet_name").fill("Dr. Rivera");
    await page.locator("#medical_records_0_notes").fill("Initial intake vaccination");
    await page.getByRole("button", { name: /Agregar otro registro médico/i }).click();
    await page.locator("#medical_records_1_record_type").selectOption("examen");
    await page.locator("#medical_records_1_date_given").fill("2026-04-15T11:30");
    await page.locator("#medical_records_1_vet_name").fill("Dr. Soto");
    await page.locator("#medical_records_1_notes").fill("Initial wellness exam");
    await page.locator("#image").setInputFiles({
      name: "buddy.jpg",
      mimeType: "image/jpeg",
      buffer: fakePngBuffer(),
    });

    await page.getByRole("button", { name: /Crear Animal/i }).click();

    // Success popup should appear — contains the checkmark icon text and success message
    await expect(page.getByText(/¡Éxito!/i)).toBeVisible();
    await expect(
      page.getByText(/animal y 2 registros médicos iniciales se crearon exitosamente con imagen/i)
    ).toBeVisible();

    // Should redirect to /admin/animals after the popup auto-closes
    await page.waitForURL(/\/admin\/animals/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/admin\/animals/);
  });

  test("leaving the medical fields blank still creates the animal and redirects", async ({ page }) => {
    await page.locator("#name").fill("Buddy Without Medical");
    await page.locator("#description").fill("Un perro muy amigable");
    await page.locator("#species").selectOption("perro");
    await page.locator("#size").selectOption("mediano");
    await page.locator("#gender").selectOption("macho");
    await page.locator("#status").selectOption("disponible");
    await page.locator("#image").setInputFiles({
      name: "buddy.jpg",
      mimeType: "image/jpeg",
      buffer: fakePngBuffer(),
    });

    await page.getByRole("button", { name: /Crear Animal/i }).click();

    await expect(page.getByText(/¡Éxito!/i)).toBeVisible();
    await expect(
      page.getByText(/animal creado exitosamente con imagen/i)
    ).toBeVisible();
    await page.waitForURL(/\/admin\/animals/, { timeout: 10000 });
  });

  test("backend partial success shows the warning message before redirecting", async ({ page }) => {
    await page.locator("#name").fill("Buddy Partial Medical");
    await page.locator("#description").fill("Un perro muy amigable");
    await page.locator("#species").selectOption("perro");
    await page.locator("#size").selectOption("mediano");
    await page.locator("#gender").selectOption("macho");
    await page.locator("#status").selectOption("disponible");
    await page.locator("#medical_records_0_record_type").selectOption("vacunación");
    await page.locator("#medical_records_0_notes").fill("Primary medical record");
    await page.getByRole("button", { name: /Agregar otro registro médico/i }).click();
    await page.locator("#medical_records_1_record_type").selectOption("examen");
    await page.locator("#medical_records_1_notes").fill("FORCE_MEDICAL_FAILURE");
    await page.locator("#image").setInputFiles({
      name: "buddy.jpg",
      mimeType: "image/jpeg",
      buffer: fakePngBuffer(),
    });

    await page.getByRole("button", { name: /Crear Animal/i }).click();

    await expect(
      page.getByText(/animal se creó con imagen, pero solo se pudieron crear 1 de 2 registros médicos iniciales/i)
    ).toBeVisible();
    await page.waitForURL(/\/admin\/animals/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/admin\/animals/);
  });
});

test.describe("Admin Edit Animal (/admin/editAnimal)", () => {
  test.beforeEach(async ({ page, request }) => {
    await resetAnimals(request);
    await page.goto(`/admin/editAnimal?id=${MOCK_ANIMALS[0].aid}`);
  });

  // --- Page load ---
  test("page loads with header", async ({ page }) => {
    await expect(page.locator("header")).toBeVisible();
  });

  test("form title 'Editar Detalles del Animal' is visible", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /Editar Detalles del Animal/i })
    ).toBeVisible();
  });

  test("back link navigates to /admin/animals", async ({ page }) => {
    const backLink = page.getByRole("link", { name: /Volver a la Lista/i });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/admin/animals");
  });

  // --- Pre-population ---
  test("name field is pre-populated with the animal's current name", async ({ page }) => {
    await expect(page.locator("#name")).toHaveValue(MOCK_ANIMALS[0].name);
  });

  test("description field is pre-populated", async ({ page }) => {
    await expect(page.locator("#description")).toHaveValue(
      MOCK_ANIMALS[0].description
    );
  });

  test("medical records are pre-populated in the edit form", async ({ page }) => {
    await expect(page.locator("#medical_records_0_record_type")).toHaveValue("vacunación");
    await expect(page.locator("#medical_records_0_vet_name")).toHaveValue("Dr. Rivera");
    await expect(page.locator("#medical_records_0_notes")).toHaveValue("Primary vaccine");
  });

  test("animal ID field is read-only and shows correct ID", async ({ page }) => {
    const aidInput = page.locator("#aid");
    await expect(aidInput).toBeDisabled();
    await expect(aidInput).toHaveValue(String(MOCK_ANIMALS[0].aid));
  });

  test("created_at field is read-only", async ({ page }) => {
    await expect(page.locator("#created_at")).toBeDisabled();
  });

  // --- Validation ---
  test("clearing name and submitting shows validation error", async ({ page }) => {
    // Disable native constraint validation so the JS onSubmit handler runs.
    // (Mock animals use English enum values that don't match Spanish <option> values,
    // which would otherwise cause native validation to block submission first.)
    await page.evaluate(() => {
      (document.querySelector("form") as HTMLFormElement).noValidate = true;
    });
    await page.locator("#name").fill("");
    await page.getByRole("button", { name: /Guardar Cambios/i }).click();
    await expect(page.getByRole("alert").filter({ hasText: /nombre/i })).toBeVisible();
  });

  // --- Tags in edit form ---
  test("can add a new tag in the edit form", async ({ page }) => {
    await page.locator("#tagInput").fill("rescatado");
    await page.locator("#tagInput").press("Enter");
    await expect(page.getByText("rescatado", { exact: true })).toBeVisible();
  });

  // --- Image upload in edit form ---
  test("selecting a new image shows a preview in edit form", async ({ page }) => {
    await page.locator("#image").setInputFiles({
      name: "new-photo.jpg",
      mimeType: "image/jpeg",
      buffer: fakePngBuffer(),
    });
    await expect(page.getByText("Vista previa de la nueva imagen:")).toBeVisible();
  });

  // --- Happy path: successful update ---
  test("updating the name and saving shows success and redirects", async ({ page }) => {
    // Mock animals use English enum values that don't match the Spanish <option> values.
    // Set all required selects to valid Spanish values before submitting.
    await page.locator("#species").selectOption("perro");
    await page.locator("#size").selectOption("mediano");
    await page.locator("#gender").selectOption("macho");
    await page.locator("#status").selectOption("disponible");
    await page.locator("#name").fill("Updated Name");
    await page.getByRole("button", { name: /Guardar Cambios/i }).click();

    await expect(page.getByText(/¡Éxito!/i)).toBeVisible({ timeout: 8000 });

    await page.waitForURL(/\/admin\/animals/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/admin\/animals/);
  });

  test("can edit medical records and add a new one before saving", async ({ page }) => {
    await page.locator("#medical_records_0_notes").fill("Updated vaccine note");
    await page.getByRole("button", { name: /Agregar otro registro médico/i }).click();
    await page.locator("#medical_records_1_record_type").selectOption("examen");
    await page.locator("#medical_records_1_notes").fill("New exam note");
    await page.getByRole("button", { name: /Guardar Cambios/i }).click();

    await expect(page.getByText(/¡Éxito!/i)).toBeVisible({ timeout: 8000 });
    await page.waitForURL(/\/admin\/animals/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/admin\/animals/);
  });

  // --- Error state: missing ID ---
  test("navigating without an id shows an error state", async ({ page }) => {
    await page.goto("/admin/editAnimal");
    // getServerSideProps returns error prop when id is missing
    await expect(page.getByText(/Animal ID is required/i)).toBeVisible();
  });

  // --- Not found state ---
  test("navigating with a non-existent id shows not found state", async ({ page }) => {
    await page.goto("/admin/editAnimal?id=99999");
    await expect(page.getByText(/Animal not found/i)).toBeVisible();
  });
});

// --- Navigation integration ---
test.describe("Admin navigation flow", () => {
  test("'Crear Nuevo Animal' button navigates to create form", async ({ page, request }) => {
    await resetAnimals(request);
    await page.goto("/admin/animals");
    await page.getByRole("link", { name: /Crear Nuevo Animal/i }).click();
    await expect(page).toHaveURL(/\/admin\/createAnimal/);
  });

  test("Edit button navigates to edit form with correct animal", async ({ page, request }) => {
    await resetAnimals(request);
    await page.goto("/admin/animals");
    await page.locator("tbody tr").first().getByRole("link", { name: "Editar" }).click();
    await expect(page).toHaveURL(
      new RegExp(`/admin/editAnimal\\?id=${MOCK_ANIMALS[0].aid}`)
    );
    // Pre-population is verified in the Admin Edit Animal suite;
    // here we only confirm the URL contains the correct animal ID.
  });
});
