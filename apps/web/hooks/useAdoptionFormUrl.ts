/**
 * Builds a pre-filled Google Form URL for adoption applications.
 *
 * Replace ANIMAL_ID_ENTRY and ANIMAL_NAME_ENTRY with the real numeric entry
 * IDs from your Google Form (e.g. "entry.123456789").
 * See docs/GOOGLE_FORMS_INTEGRATION.md for how to find them.
 *
 * Returns null when NEXT_PUBLIC_GOOGLE_FORM_URL is not configured.
 */
export function buildAdoptionFormUrl(
  animalId: number,
  animalName: string
): string | null {
  const base = process.env.NEXT_PUBLIC_GOOGLE_FORM_URL;
  if (!base) return null;

  // Strip the base URL to just the viewform path (remove any ?usp=... Google appends to sharing links)
  const viewformUrl = base.split("?")[0];

  const params = new URLSearchParams({
    "entry.ANIMAL_ID_ENTRY": String(animalId),
    "entry.ANIMAL_NAME_ENTRY": animalName,
  });

  return `${viewformUrl}?${params.toString()}`;
}
