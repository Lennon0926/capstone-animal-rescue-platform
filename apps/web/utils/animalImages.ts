/**
 * Utility functions for handling animal images with fallbacks
 */

// Placeholder images for different species
const PLACEHOLDER_IMAGES: Record<string, string[]> = {
  dog: [
    "/Animals/dog1.jpeg",
    "/Animals/dog2.jpeg",
  ],
  cat: [
    "/Animals/cat1.jpeg",
    "/Animals/cat2.jpeg",
  ],
  default: [
    "/Animals/dog1.jpeg",
    "/Animals/cat1.jpeg",
  ],
};

/**
 * Get a placeholder image URL based on species and optional index for variety
 */
export function getPlaceholderImage(species?: string, index: number = 0): string {
  const normalizedSpecies = species?.toLowerCase() || "default";
  const images = PLACEHOLDER_IMAGES[normalizedSpecies] || PLACEHOLDER_IMAGES.default;
  return images[index % images.length];
}

const R2_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.replace(/\/+$/, "");

function encodeObjectKey(objectKey: string): string {
  return objectKey
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

/**
 * Get the animal image URL, falling back to a placeholder if not available
 */
export function getAnimalImageUrl(
  imageUrl: string | null | undefined,
  species?: string,
  animalId?: number,
  imageObjectKey?: string | null
): string {
  const normalizedObjectKey = imageObjectKey?.trim().replace(/^\/+/, "");
  if (normalizedObjectKey && R2_PUBLIC_BASE_URL) {
    return `${R2_PUBLIC_BASE_URL}/${encodeObjectKey(normalizedObjectKey)}`;
  }

  if (imageUrl && imageUrl.trim() !== "") {
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }
  }

  // Use animal ID to get variety in placeholder images
  const index = animalId ? animalId % 2 : 0;
  return getPlaceholderImage(species, index);
}

/**
 * Check if an image URL is valid (not empty or null)
 */
export function hasValidImage(imageUrl: string | null | undefined): boolean {
  return Boolean(imageUrl && imageUrl.trim() !== "");
}
