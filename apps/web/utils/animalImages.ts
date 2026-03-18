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

/**
 * Extracts the R2 object key from various URL formats:
 * - Plain objectKey: "animals/14/file.png"
 * - Signed R2 URL:   "https://account.r2.cloudflarestorage.com/animals/2/file.jpeg?X-Amz-..."
 */
function extractR2ObjectKey(imageUrl: string): string | null {
  // Signed R2 URL (contains X-Amz params)
  if (imageUrl.includes("r2.cloudflarestorage.com") && imageUrl.includes("X-Amz-")) {
    try {
      const url = new URL(imageUrl);
      // pathname is like "/animals/2/file.jpeg"
      return url.pathname.replace(/^\//, "");
    } catch {
      return null;
    }
  }
  // Plain objectKey (no protocol)
  if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
    return imageUrl.replace(/^\//, "");
  }
  return null;
}

/**
 * Get the animal image URL, falling back to a placeholder if not available
 */
export function getAnimalImageUrl(
  imageUrl: string | null | undefined,
  species?: string,
  animalId?: number
): string {
  if (imageUrl && imageUrl.trim() !== "") {
    const objectKey = extractR2ObjectKey(imageUrl);

    // If we extracted an objectKey and have a public base URL, reconstruct the full URL
    if (objectKey && R2_PUBLIC_BASE_URL) {
      return `${R2_PUBLIC_BASE_URL}/${objectKey}`;
    }

    // Already a valid absolute URL (public R2, unsplash, etc.)
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
