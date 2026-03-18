/**
 * Builds a pre-filled Google Form URL for adoption applications.
 *
 * Pre-fills the "Animal interested in" field (entry.1580902172) with the
 * animal's name so staff can see which animal the applicant wants to adopt.
 *
 * Returns null when NEXT_PUBLIC_GOOGLE_FORM_URL is not configured.
 */
export function buildAdoptionFormUrl(
  _animalId: number,
  animalName: string
): string | null {
  const base = process.env.NEXT_PUBLIC_GOOGLE_FORM_URL;
  if (!base) return null;

  // Strip any ?usp=... Google appends to sharing links
  const viewformUrl = base.split("?")[0];

  const params = new URLSearchParams({
    "entry.1580902172": animalName,
  });

  return `${viewformUrl}?${params.toString()}`;
}
