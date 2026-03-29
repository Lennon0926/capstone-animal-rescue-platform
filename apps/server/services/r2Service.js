/**
 * Cloudflare R2 Service
 * Encapsulates R2 client setup, configuration, and image upload helpers.
 */

const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

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

  await r2Client.send(
    new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: objectKey,
      Body: buffer,
      ContentType: mimetype,
    })
  );

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
  uploadAnimalImage,
};
