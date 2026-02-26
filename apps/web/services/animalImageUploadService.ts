const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export type AnimalImageUploadResult = {
  objectKey: string;
  url: string;
  urlType: "public" | "signed-read";
  contentType: string;
  size: number;
};

type UploadApiResponse = {
  data?: AnimalImageUploadResult;
  error?: {
    code?: string;
    message?: string;
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

  const payload = (await response.json().catch(() => null)) as
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
