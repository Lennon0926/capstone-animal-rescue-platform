const path = require("path");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const multer = require("multer");

dotenv.config({ path: path.resolve(__dirname, ".env.local") });
const { validateEnv, REQUIRED_ENV_VARS } = require("./validateEnv");

validateEnv();

const app = express();
const port = Number(process.env.PORT) || 4000;
const startedAt = new Date().toISOString();

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const DEFAULT_MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const DEFAULT_SIGNED_READ_URL_TTL_SECONDS = 60 * 60;
const ANIMAL_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;
const MIME_TYPE_EXTENSION_MAP = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const parsePositiveInteger = (rawValue, fallback) => {
  const parsedValue = Number(rawValue);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return fallback;
  }

  return Math.floor(parsedValue);
};

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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxImageSizeBytes,
    files: 1,
  },
});

const getErrorPayload = (code, message, details) => ({
  error: {
    code,
    message,
    ...(details ? { details } : {}),
  },
});

const sanitizeFilename = (rawFilename, mimeType) => {
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
};

const getObjectUrl = async (objectKey, client) => {
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
    client,
    new GetObjectCommand({
      Bucket: r2Config.bucketName,
      Key: objectKey,
    }),
    { expiresIn: signedReadUrlTtlSeconds }
  );
};

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "This is the Capstone Animal Rescue Platform" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), startedAt });
});

app.get("/ready", (req, res) => {
  const envReady = REQUIRED_ENV_VARS.every((key) => !!process.env[key]);

  if (!envReady) {
    return res.status(503).json({ status: "not ready", reason: "missing env" });
  }

  res.json({ status: "ready" });
});

app.get("/api/uploads/config", (req, res) => {
  res.json({
    data: {
      r2Configured: isR2Configured,
      missingEnvVars: isR2Configured ? [] : missingR2EnvVars,
      allowedMimeTypes: Array.from(ALLOWED_MIME_TYPES),
      maxImageSizeBytes,
      signedReadUrlTtlSeconds,
    },
  });
});

app.post(
  "/api/uploads/animals/:animalId/image",
  upload.single("image"),
  async (req, res, next) => {
    const animalId = String(req.params.animalId || "").trim();
    if (!ANIMAL_ID_PATTERN.test(animalId)) {
      return res
        .status(400)
        .json(
          getErrorPayload(
            "INVALID_ANIMAL_ID",
            "animalId must be 1-64 chars using only letters, numbers, underscores, or dashes."
          )
        );
    }

    if (!req.file) {
      return res
        .status(400)
        .json(
          getErrorPayload(
            "MISSING_IMAGE_FILE",
            "No upload file found. Send one file using multipart field name \"image\"."
          )
        );
    }

    if (!ALLOWED_MIME_TYPES.has(req.file.mimetype)) {
      return res
        .status(415)
        .json(
          getErrorPayload(
            "INVALID_IMAGE_TYPE",
            `Unsupported content type "${req.file.mimetype}". Allowed types: ${Array.from(
              ALLOWED_MIME_TYPES
            ).join(", ")}.`
          )
        );
    }

    if (!isR2Configured || !r2Client) {
      return res
        .status(500)
        .json(
          getErrorPayload(
            "R2_NOT_CONFIGURED",
            "Cloudflare R2 is not configured on the server.",
            { missingEnvVars: missingR2EnvVars }
          )
        );
    }

    try {
      const safeFilename = sanitizeFilename(
        req.file.originalname,
        req.file.mimetype
      );
      const objectKey = `animals/${animalId}/${Date.now()}-${safeFilename}`;

      await r2Client.send(
        new PutObjectCommand({
          Bucket: r2Config.bucketName,
          Key: objectKey,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        })
      );
      const usesPublicUrl = Boolean(r2Config.publicBaseUrl);
      const url = await getObjectUrl(objectKey, r2Client);

      return res.status(201).json({
        data: {
          objectKey,
          url,
          urlType: usesPublicUrl ? "public" : "signed-read",
          contentType: req.file.mimetype,
          size: req.file.size,
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(413)
        .json(
          getErrorPayload(
            "IMAGE_TOO_LARGE",
            `Image exceeds the ${maxImageSizeBytes} byte upload limit.`
          )
        );
    }

    return res
      .status(400)
      .json(getErrorPayload("UPLOAD_ERROR", error.message || "Upload failed."));
  }

  console.error("[upload] Unexpected error", error);
  return res
    .status(500)
    .json(
      getErrorPayload(
        "INTERNAL_SERVER_ERROR",
        "Unexpected server error while processing upload."
      )
    );
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });
}

module.exports = app;
