/**
 * Builds a pre-filled Google Form URL for adoption applications.
 *
 * Pre-fill field IDs are read from environment variables so the form can be
 * swapped or updated without touching this code:
 *
 *   NEXT_PUBLIC_GOOGLE_FORM_URL              — the base viewform URL
 *   NEXT_PUBLIC_GOOGLE_FORM_ENTRY_ANIMAL_ID  — entry ID for the animal-ID field
 *   NEXT_PUBLIC_GOOGLE_FORM_ENTRY_ANIMAL_NAME — entry ID for the animal-name field
 *
 * Returns null when NEXT_PUBLIC_GOOGLE_FORM_URL is not configured.
 * Fields with no configured entry ID are silently omitted from the URL.
 */
export function buildAdoptionFormUrl(
  animalId: number,
  animalName: string
): string | null {
  const base = process.env.NEXT_PUBLIC_GOOGLE_FORM_URL;
  if (!base) return null;

  // Strip any ?usp=... Google appends to sharing links
  const viewformUrl = base.split("?")[0];

  const params = new URLSearchParams();

  const animalIdEntry = process.env.NEXT_PUBLIC_GOOGLE_FORM_ENTRY_ANIMAL_ID;
  if (animalIdEntry) {
    params.set(animalIdEntry, String(animalId));
  }

  const animalNameEntry = process.env.NEXT_PUBLIC_GOOGLE_FORM_ENTRY_ANIMAL_NAME;
  if (animalNameEntry) {
    params.set(animalNameEntry, animalName);
  }

  const query = params.toString();
  return query ? `${viewformUrl}?${query}` : viewformUrl;
}
