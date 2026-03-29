const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export type AnimalImageUploadResult = {
  objectKey: string;
  url: string;
  urlType: "public";
  contentType: string;
  size: number;
};

export type { Animal } from "@/types/animal";
import type { Animal } from "@/types/animal";

type UploadApiResponse = {
  data?: AnimalImageUploadResult;
  error?: {
    code?: string;
    message?: string;
  };
};

type AnimalApiResponse = {
  success: boolean;
  data?: Animal;
  error?: string;
};

type AnimalsListResponse = {
  success: boolean;
  data?: Animal[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

const getApiBaseUrl = () => {
  if (!API_BASE_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is not defined. Set it in apps/web/.env.local."
    );
  }

  return API_BASE_URL;
};

/**
 * Fetches all animals from the API
 */
export const fetchAnimals = async (): Promise<Animal[]> => {
  const response = await fetch(`${getApiBaseUrl()}/api/animals?limit=100`);
  
  const payload = (await response.json().catch((err: unknown) => {
    console.error("[fetchAnimals] Failed to parse response JSON:", err);
    return null;
  })) as AnimalsListResponse | null;

  if (!response.ok || !payload?.success) {
    throw new Error("Failed to fetch animals.");
  }

  return payload.data || [];
};

/**
 * Uploads an image to Cloudflare R2
 */
export const uploadAnimalImage = async (
  animalId: string,
  file: File
): Promise<AnimalImageUploadResult> => {
  const cleanedAnimalId = animalId.trim();
  if (!cleanedAnimalId) {
    throw new Error("Animal ID is required.");
  }

  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(
    `${getApiBaseUrl()}/api/uploads/animals/${encodeURIComponent(
      cleanedAnimalId
    )}/image`,
    {
      method: "POST",
      body: formData,
    }
  );

  const payload = (await response.json().catch((err: unknown) => {
    console.error("[uploadAnimalImage] Failed to parse response JSON:", err);
    return null;
  })) as
    | UploadApiResponse
    | null;

  if (!response.ok) {
    throw new Error(payload?.error?.message || "Image upload failed.");
  }

  if (!payload?.data) {
    throw new Error("Upload succeeded, but response payload was invalid.");
  }

  return payload.data;
};

/**
 * Updates an animal's persisted image object key in the database.
 */
export const updateAnimalImageObjectKey = async (
  animalId: number,
  imageObjectKey: string
): Promise<Animal> => {
  const response = await fetch(
    `${getApiBaseUrl()}/api/animals/${animalId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image_object_key: imageObjectKey }),
    }
  );

  const payload = (await response.json().catch((err: unknown) => {
    console.error("[updateAnimalImageObjectKey] Failed to parse response JSON:", err);
    return null;
  })) as AnimalApiResponse | null;

  if (!response.ok) {
    throw new Error(payload?.error || "Failed to update animal image.");
  }

  if (!payload?.data) {
    throw new Error("Update succeeded, but response payload was invalid.");
  }

  return payload.data;
};
/**
 * Complete flow: Upload image to R2 and update animal record
 */
export const uploadAndUpdateAnimalImage = async (
  animalId: number,
  file: File
): Promise<{ uploadResult: AnimalImageUploadResult; animal: Animal }> => {
  // Step 1: Upload image to Cloudflare R2
  const uploadResult = await uploadAnimalImage(String(animalId), file);

  // Step 2: Update animal record with new image object key
  const animal = await updateAnimalImageObjectKey(animalId, uploadResult.objectKey);

  return { uploadResult, animal };
};
