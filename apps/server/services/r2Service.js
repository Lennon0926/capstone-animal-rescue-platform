/**
 * Cloudflare R2 Service
 * Encapsulates R2 client setup, configuration, and image upload helpers.
 */

const path = require("path");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

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
const DEFAULT_SIGNED_READ_URL_TTL_SECONDS = 60 * 60;

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

const signedReadUrlTtlSeconds = parsePositiveInteger(
  process.env.R2_SIGNED_READ_URL_TTL_SECONDS,
  DEFAULT_SIGNED_READ_URL_TTL_SECONDS
);

const r2Config = {
  accountId: process.env.R2_ACCOUNT_ID,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  bucketName: process.env.R2_BUCKET_NAME,
  publicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
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

/**
 * Returns a public or signed URL for an R2 object.
 * @param {string} objectKey - R2 object key
 * @returns {Promise<string>} URL to access the object
 */
async function getObjectUrl(objectKey) {
  const encodedObjectKey = objectKey
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  if (r2Config.publicBaseUrl) {
    const baseUrlWithoutTrailingSlash = r2Config.publicBaseUrl.replace(
      /\/+$/,
      ""
    );
    return `${baseUrlWithoutTrailingSlash}/${encodedObjectKey}`;
  }

  return getSignedUrl(
    r2Client,
    new GetObjectCommand({
      Bucket: r2Config.bucketName,
      Key: objectKey,
    }),
    { expiresIn: signedReadUrlTtlSeconds }
  );
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

  const usesPublicUrl = Boolean(r2Config.publicBaseUrl);
  const url = await getObjectUrl(objectKey);

  return {
    objectKey,
    url,
    urlType: usesPublicUrl ? "public" : "signed-read",
    contentType: mimetype,
    size: buffer.length,
  };
}

module.exports = {
  ALLOWED_MIME_TYPES,
  MIME_TYPE_EXTENSION_MAP,
  ANIMAL_ID_PATTERN,
  maxImageSizeBytes,
  signedReadUrlTtlSeconds,
  isR2Configured,
  missingR2EnvVars,
  sanitizeFilename,
  getObjectUrl,
  uploadAnimalImage,
};
