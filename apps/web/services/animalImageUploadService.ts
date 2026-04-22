import type { Animal } from "@/types/animal";
import { getAuthenticatedHeaders } from "@/lib/apiAuth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export type AnimalImageUploadResult = {
  objectKey: string;
  url: string;
  urlType: "public";
  contentType: string;
  size: number;
};

export type UploadHealthStatus = {
  ok: boolean;
  code: string;
  message: string;
  checkedAt: string;
};

export type UploadConfig = {
  r2Configured: boolean;
  missingEnvVars: string[];
  publicObjectUrlConfigured: boolean;
  missingPublicObjectUrlEnvVars: string[];
  allowedMimeTypes: string[];
  maxImageSizeBytes: number;
  health: UploadHealthStatus;
};

export type { Animal };

type ApiErrorCode = string | number;

type UploadApiErrorShape = {
  code?: ApiErrorCode;
  message?: string;
  details?: unknown;
};

type UploadApiResponse = {
  data?: AnimalImageUploadResult;
  error?: UploadApiErrorShape;
};

type UploadConfigApiResponse = {
  data?: UploadConfig;
  error?: UploadApiErrorShape;
};

type AnimalApiResponse = {
  success: boolean;
  data?: Animal;
  error?: UploadApiErrorShape | string;
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

export class UploadApiError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "UploadApiError";
    this.code = code;
  }
}

type UploadLogLevel = "error" | "info";

const getApiBaseUrl = () => {
  if (!API_BASE_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is not defined. Set it in apps/web/.env.local."
    );
  }

  return API_BASE_URL;
};

const logUploadEvent = (
  level: UploadLogLevel,
  event: string,
  metadata: Record<string, unknown>
) => {
  const logger = level === "error" ? console.error : console.info;

  logger(
    JSON.stringify({
      ts: new Date().toISOString(),
      app: "animal-rescue-web",
      area: "animal-image-upload",
      level,
      event,
      ...metadata,
    })
  );
};

const normalizeApiError = (
  error: UploadApiErrorShape | string | undefined,
  fallbackMessage: string
) => {
  if (typeof error === "string") {
    return {
      message: error || fallbackMessage,
      code: undefined,
      details: undefined,
    };
  }

  return {
    message: error?.message || fallbackMessage,
    code:
      error?.code === undefined || error?.code === null
        ? undefined
        : String(error.code),
    details: error?.details,
  };
};

const parseJsonSafely = async <T>(
  response: Response,
  scope: string
): Promise<T | null> => {
  return (await response.json().catch((err: unknown) => {
    logUploadEvent("error", "api_response_json_parse_failed", {
      scope,
      httpStatus: response.status,
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    return null;
  })) as T | null;
};

const buildUploadApiError = (
  error: UploadApiErrorShape | string | undefined,
  fallbackMessage: string,
  logContext?: {
    event: string;
    metadata: Record<string, unknown>;
  }
) => {
  const normalizedError = normalizeApiError(error, fallbackMessage);

  if (logContext) {
    logUploadEvent("error", logContext.event, {
      ...logContext.metadata,
      errorCode: normalizedError.code ?? null,
      errorMessage: normalizedError.message,
      errorDetails: normalizedError.details ?? null,
    });
  }

  return new UploadApiError(normalizedError.message, normalizedError.code);
};

export const isUploadStorageAvailable = (
  config: UploadConfig | null | undefined
): config is UploadConfig => {
  return Boolean(
    config?.r2Configured &&
      config?.publicObjectUrlConfigured &&
      config?.health?.ok
  );
};

export const getUploadStorageUnavailableMessage = (
  config: UploadConfig | null | undefined,
  fallbackMessage = "El almacenamiento de imágenes no está disponible en este momento."
) => {
  if (!config) {
    return fallbackMessage;
  }

  if (!config.r2Configured) {
    return config.missingEnvVars.length > 0
      ? `El almacenamiento de imágenes no está configurado. Variables faltantes: ${config.missingEnvVars.join(", ")}.`
      : "El almacenamiento de imágenes no está configurado en el servidor.";
  }

  if (!config.publicObjectUrlConfigured) {
    return config.missingPublicObjectUrlEnvVars.length > 0
      ? `Falta configurar la URL pública del almacenamiento. Variables faltantes: ${config.missingPublicObjectUrlEnvVars.join(", ")}.`
      : "Falta configurar la URL pública del almacenamiento de imágenes.";
  }

  if (config.health.ok) {
    return "";
  }

  switch (config.health.code) {
    case "R2_UNAUTHORIZED":
      return "El almacenamiento de imágenes no está disponible porque Cloudflare R2 rechazó las credenciales configuradas en el servidor.";
    case "R2_UNAVAILABLE":
      return "El almacenamiento de imágenes no está disponible porque Cloudflare R2 no pudo procesar la solicitud.";
    case "R2_NOT_CONFIGURED":
      return "El almacenamiento de imágenes no está configurado en el servidor.";
    case "R2_PUBLIC_URL_NOT_CONFIGURED":
      return "La URL pública de Cloudflare R2 no está configurada en el servidor.";
    default:
      return config.health.message || fallbackMessage;
  }
};

/**
 * Fetches the current upload configuration and storage health.
 */
export const fetchUploadConfig = async (): Promise<UploadConfig> => {
  const response = await fetch(`${getApiBaseUrl()}/api/uploads/config`);
  const payload = await parseJsonSafely<UploadConfigApiResponse>(
    response,
    "fetchUploadConfig"
  );

  if (!response.ok) {
    throw buildUploadApiError(
      payload?.error,
      "No se pudo verificar la configuración del almacenamiento.",
      {
        event: "upload_config_fetch_failed",
        metadata: {
          route: "GET /api/uploads/config",
          httpStatus: response.status,
        },
      }
    );
  }

  if (!payload?.data?.health) {
    throw new Error(
      "La verificación del almacenamiento respondió con un formato inválido."
    );
  }

  return payload.data;
};

/**
 * Fetches all animals from the API.
 */
export const fetchAnimals = async (): Promise<Animal[]> => {
  const response = await fetch(`${getApiBaseUrl()}/api/animals?limit=100`);
  const payload = await parseJsonSafely<AnimalsListResponse>(
    response,
    "fetchAnimals"
  );

  if (!response.ok || !payload?.success) {
    throw new Error("Failed to fetch animals.");
  }

  return payload.data || [];
};

/**
 * Uploads an image to Cloudflare R2.
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
      headers: await getAuthenticatedHeaders(),
      body: formData,
    }
  );

  const payload = await parseJsonSafely<UploadApiResponse>(
    response,
    "uploadAnimalImage"
  );

  if (!response.ok) {
    throw buildUploadApiError(payload?.error, "Image upload failed.", {
      event: "animal_image_upload_failed",
      metadata: {
        route: "POST /api/uploads/animals/:animalId/image",
        animalId: cleanedAnimalId,
        httpStatus: response.status,
      },
    });
  }

  if (!payload?.data) {
    logUploadEvent("error", "animal_image_upload_invalid_payload", {
      route: "POST /api/uploads/animals/:animalId/image",
      animalId: cleanedAnimalId,
      httpStatus: response.status,
    });
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
  const response = await fetch(`${getApiBaseUrl()}/api/animals/${animalId}`, {
    method: "PATCH",
    headers: await getAuthenticatedHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ image_object_key: imageObjectKey }),
  });

  const payload = await parseJsonSafely<AnimalApiResponse>(
    response,
    "updateAnimalImageObjectKey"
  );

  if (!response.ok) {
    throw buildUploadApiError(
      payload?.error,
      "Failed to update animal image.",
      {
        event: "animal_image_update_failed",
        metadata: {
          route: "PATCH /api/animals/:aid",
          animalId,
          imageObjectKey,
          httpStatus: response.status,
        },
      }
    );
  }

  if (!payload?.data) {
    logUploadEvent("error", "animal_image_update_invalid_payload", {
      route: "PATCH /api/animals/:aid",
      animalId,
      imageObjectKey,
      httpStatus: response.status,
    });
    throw new Error("Update succeeded, but response payload was invalid.");
  }

  return payload.data;
};

/**
 * Complete flow: upload image to R2 and update animal record.
 */
export const uploadAndUpdateAnimalImage = async (
  animalId: number,
  file: File
): Promise<{ uploadResult: AnimalImageUploadResult; animal: Animal }> => {
  const uploadResult = await uploadAnimalImage(String(animalId), file);
  const animal = await updateAnimalImageObjectKey(animalId, uploadResult.objectKey);

  return { uploadResult, animal };
};
