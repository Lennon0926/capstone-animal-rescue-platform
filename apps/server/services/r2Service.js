/**
 * Cloudflare R2 Service
 * Encapsulates R2 client setup, configuration, and image upload helpers.
 */

const { randomUUID } = require("crypto");
const path = require("path");
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MIME_TYPE_EXTENSION_MAP = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const ANIMAL_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

const DEFAULT_MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const DEFAULT_HEALTHCHECK_CACHE_TTL_MS = 30 * 1000;

function parsePositiveInteger(rawValue, fallback) {
  const parsedValue = Number(rawValue);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return fallback;
  }
  return Math.floor(parsedValue);
}

const maxImageSizeBytes = parsePositiveInteger(
  process.env.R2_MAX_IMAGE_SIZE_BYTES,
  DEFAULT_MAX_IMAGE_SIZE_BYTES
);
const healthcheckCacheTtlMs = parsePositiveInteger(
  process.env.R2_HEALTHCHECK_CACHE_TTL_MS,
  DEFAULT_HEALTHCHECK_CACHE_TTL_MS
);

const r2Config = {
  accountId: process.env.R2_ACCOUNT_ID,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  bucketName: process.env.R2_BUCKET_NAME,
  publicBaseUrl: process.env.R2_PUBLIC_BASE_URL?.replace(/\/+$/, ""),
};

const missingR2EnvVars = Object.entries({
  R2_ACCOUNT_ID: r2Config.accountId,
  R2_ACCESS_KEY_ID: r2Config.accessKeyId,
  R2_SECRET_ACCESS_KEY: r2Config.secretAccessKey,
  R2_BUCKET_NAME: r2Config.bucketName,
})
  .filter(([, value]) => !value)
  .map(([key]) => key);

const isR2Configured = missingR2EnvVars.length === 0;
const isPublicObjectUrlConfigured = Boolean(r2Config.publicBaseUrl);
const missingPublicObjectUrlEnvVars = isPublicObjectUrlConfigured
  ? []
  : ["R2_PUBLIC_BASE_URL"];

const r2Client = isR2Configured
  ? new S3Client({
      region: "auto",
      endpoint: `https://${r2Config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: r2Config.accessKeyId,
        secretAccessKey: r2Config.secretAccessKey,
      },
    })
  : null;

if (!isR2Configured) {
  console.warn(
    `[r2] Upload endpoint disabled. Missing environment variables: ${missingR2EnvVars.join(
      ", "
    )}`
  );
}

let healthcheckCache = null;
let activeHealthcheckPromise = null;

function buildHealthStatus(ok, code, message) {
  return {
    ok,
    code,
    message,
    checkedAt: new Date().toISOString(),
  };
}

function cacheHealthStatus(status) {
  healthcheckCache = {
    expiresAt: Date.now() + healthcheckCacheTtlMs,
    value: status,
  };

  return status;
}

function getCachedHealthStatus() {
  if (!healthcheckCache || healthcheckCache.expiresAt <= Date.now()) {
    return null;
  }

  return healthcheckCache.value;
}

function getStaticHealthStatus() {
  if (!isR2Configured) {
    return buildHealthStatus(
      false,
      "R2_NOT_CONFIGURED",
      "Cloudflare R2 is not configured on the server."
    );
  }

  if (!isPublicObjectUrlConfigured) {
    return buildHealthStatus(
      false,
      "R2_PUBLIC_URL_NOT_CONFIGURED",
      "R2_PUBLIC_BASE_URL must be configured for persistent animal image uploads."
    );
  }

  return null;
}

function classifyR2Error(error) {
  const statusCode = error?.$metadata?.httpStatusCode ?? null;
  const errorCode =
    typeof error?.Code === "string"
      ? error.Code
      : typeof error?.code === "string"
        ? error.code
        : null;
  const errorName = typeof error?.name === "string" ? error.name : null;
  const unauthorizedCodes = new Set([
    "Unauthorized",
    "AccessDenied",
    "InvalidAccessKeyId",
    "SignatureDoesNotMatch",
    "AuthFailure",
  ]);

  if (
    statusCode === 401 ||
    statusCode === 403 ||
    unauthorizedCodes.has(errorCode) ||
    unauthorizedCodes.has(errorName)
  ) {
    return {
      code: "R2_UNAUTHORIZED",
      message:
        "Cloudflare R2 rejected the configured server credentials for the upload bucket.",
    };
  }

  return {
    code: "R2_UNAVAILABLE",
    message:
      "Cloudflare R2 is unavailable or could not process the upload request.",
  };
}

class R2DependencyError extends Error {
  constructor(code, message, cause = null) {
    super(message);
    this.name = "R2DependencyError";
    this.code = code;
    this.statusCode = 503;
    this.cause = cause;
  }
}

function isR2DependencyError(error) {
  return error instanceof R2DependencyError;
}

function createR2DependencyError(error) {
  const { code, message } = classifyR2Error(error);
  return new R2DependencyError(code, message, error);
}

async function probeR2Health() {
  const staticHealthStatus = getStaticHealthStatus();
  if (staticHealthStatus) {
    return staticHealthStatus;
  }

  const objectKey = `healthchecks/uploads/${Date.now()}-${randomUUID()}.txt`;

  try {
    await r2Client.send(
      new PutObjectCommand({
        Bucket: r2Config.bucketName,
        Key: objectKey,
        Body: "",
        ContentType: "text/plain",
      })
    );

    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: r2Config.bucketName,
        Key: objectKey,
      })
    );

    return buildHealthStatus(true, "R2_OK", "Cloudflare R2 is available.");
  } catch (error) {
    const { code, message } = classifyR2Error(error);
    return buildHealthStatus(false, code, message);
  }
}

async function checkR2Health(options = {}) {
  const { forceRefresh = false } = options;
  const staticHealthStatus = getStaticHealthStatus();
  if (staticHealthStatus) {
    return cacheHealthStatus(staticHealthStatus);
  }

  if (!forceRefresh) {
    const cachedHealthStatus = getCachedHealthStatus();
    if (cachedHealthStatus) {
      return cachedHealthStatus;
    }
  }

  if (activeHealthcheckPromise) {
    return activeHealthcheckPromise;
  }

  activeHealthcheckPromise = probeR2Health()
    .then((status) => cacheHealthStatus(status))
    .finally(() => {
      activeHealthcheckPromise = null;
    });

  return activeHealthcheckPromise;
}

/**
 * Sanitizes a filename for safe storage in R2.
 * @param {string} rawFilename - Original filename from upload
 * @param {string} mimeType - MIME type of the file
 * @returns {string} Safe filename
 */
function sanitizeFilename(rawFilename, mimeType) {
  const sourceFilename =
    typeof rawFilename === "string" && rawFilename.trim()
      ? rawFilename.trim()
      : "image";
  const sourceExtension = path
    .extname(sourceFilename)
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, "");
  const baseName = path.basename(sourceFilename, path.extname(sourceFilename));

  const safeBaseName =
    baseName
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "image";

  const fallbackExtension = MIME_TYPE_EXTENSION_MAP[mimeType] || "bin";
  const safeExtension = sourceExtension || `.${fallbackExtension}`;

  return `${safeBaseName}${safeExtension}`;
}

function normalizeObjectKey(objectKey) {
  if (typeof objectKey !== "string") {
    return null;
  }

  const trimmed = objectKey.trim().replace(/^\/+/, "");
  return trimmed ? trimmed : null;
}

function stripConfiguredBasePath(pathname) {
  if (!isPublicObjectUrlConfigured) {
    return pathname;
  }

  try {
    const configuredUrl = new URL(r2Config.publicBaseUrl);
    const configuredPath = configuredUrl.pathname.replace(/\/+$/, "");

    if (!configuredPath || configuredPath === "/") {
      return pathname;
    }

    if (pathname === configuredPath) {
      return "/";
    }

    if (pathname.startsWith(`${configuredPath}/`)) {
      return pathname.slice(configuredPath.length);
    }

    return null;
  } catch {
    return pathname;
  }
}

function extractObjectKeyFromImageReference(imageReference) {
  const normalizedValue = normalizeObjectKey(imageReference);

  if (!normalizedValue) {
    return null;
  }

  if (!/^https?:\/\//i.test(normalizedValue)) {
    return normalizedValue;
  }

  try {
    const parsedUrl = new URL(normalizedValue);
    const hostname = parsedUrl.hostname.toLowerCase();
    const normalizedPathname = stripConfiguredBasePath(parsedUrl.pathname);

    if (!normalizedPathname) {
      return null;
    }

    if (
      hostname.endsWith(".r2.cloudflarestorage.com") ||
      hostname.endsWith(".r2.dev")
    ) {
      return normalizeObjectKey(normalizedPathname);
    }

    if (isPublicObjectUrlConfigured) {
      const configuredUrl = new URL(r2Config.publicBaseUrl);
      if (parsedUrl.origin === configuredUrl.origin) {
        return normalizeObjectKey(normalizedPathname);
      }
    }

    return null;
  } catch {
    return null;
  }
}

function getPublicObjectUrl(objectKey) {
  const normalizedObjectKey = normalizeObjectKey(objectKey);
  if (!normalizedObjectKey || !isPublicObjectUrlConfigured) {
    return null;
  }

  const encodedObjectKey = normalizedObjectKey
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `${r2Config.publicBaseUrl}/${encodedObjectKey}`;
}

/**
 * Uploads a file buffer to R2 and returns the object key and URL.
 * @param {string} animalId - Animal ID used in the object key path
 * @param {Buffer} buffer - File buffer
 * @param {string} originalname - Original filename
 * @param {string} mimetype - MIME type
 * @returns {Promise<{objectKey: string, url: string, urlType: string, contentType: string, size: number}>}
 */
async function uploadAnimalImage(animalId, buffer, originalname, mimetype) {
  const safeFilename = sanitizeFilename(originalname, mimetype);
  const objectKey = `animals/${animalId}/${Date.now()}-${safeFilename}`;

  try {
    await r2Client.send(
      new PutObjectCommand({
        Bucket: r2Config.bucketName,
        Key: objectKey,
        Body: buffer,
        ContentType: mimetype,
      })
    );
    cacheHealthStatus(
      buildHealthStatus(true, "R2_OK", "Cloudflare R2 is available.")
    );
  } catch (error) {
    const { code, message } = classifyR2Error(error);
    cacheHealthStatus(buildHealthStatus(false, code, message));
    throw createR2DependencyError(error);
  }

  const url = getPublicObjectUrl(objectKey);
  if (!url) {
    throw new Error(
      "R2_PUBLIC_BASE_URL must be configured for persistent animal image uploads."
    );
  }

  return {
    objectKey,
    url,
    urlType: "public",
    contentType: mimetype,
    size: buffer.length,
  };
}

module.exports = {
  ALLOWED_MIME_TYPES,
  MIME_TYPE_EXTENSION_MAP,
  ANIMAL_ID_PATTERN,
  maxImageSizeBytes,
  isR2Configured,
  missingR2EnvVars,
  isPublicObjectUrlConfigured,
  missingPublicObjectUrlEnvVars,
  sanitizeFilename,
  normalizeObjectKey,
  extractObjectKeyFromImageReference,
  getPublicObjectUrl,
  checkR2Health,
  isR2DependencyError,
  uploadAnimalImage,
};
