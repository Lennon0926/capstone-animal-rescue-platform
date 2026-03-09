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

/**
 * Get the animal image URL, falling back to a placeholder if not available
 */
export function getAnimalImageUrl(
  imageUrl: string | null | undefined,
  species?: string,
  animalId?: number
): string {
  // If we have a valid image URL, use it
  if (imageUrl && imageUrl.trim() !== "") {
    return imageUrl;
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
