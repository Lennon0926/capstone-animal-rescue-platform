/**
 * Uploads API Routes
 * Handles animal image uploads to Cloudflare R2.
 */

const express = require("express");
const multer = require("multer");
const router = express.Router();

const {
  ALLOWED_MIME_TYPES,
  ANIMAL_ID_PATTERN,
  POST_ID_PATTERN,
  maxImageSizeBytes,
  isR2Configured,
  missingR2EnvVars,
  isPublicObjectUrlConfigured,
  missingPublicObjectUrlEnvVars,
  checkR2Health,
  isR2DependencyError,
  uploadAnimalImage,
  uploadPostImage,
} = require("../services/r2Service");
const { asyncHandler } = require("../middleware/errorHandler");
const { requireAuth } = require("../middleware/auth");

const ALLOWED_MIME_TYPES_ARRAY = Array.from(ALLOWED_MIME_TYPES);

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

/**
 * GET /api/uploads/config
 * Returns current R2 upload configuration status.
 */
router.get("/config", async (req, res, next) => {
  try {
    const health = await checkR2Health();

    res.json({
      data: {
        r2Configured: isR2Configured,
        missingEnvVars: isR2Configured ? [] : missingR2EnvVars,
        publicObjectUrlConfigured: isPublicObjectUrlConfigured,
        missingPublicObjectUrlEnvVars,
        allowedMimeTypes: ALLOWED_MIME_TYPES_ARRAY,
        maxImageSizeBytes,
        health,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/uploads/animals/:animalId/image
 * Uploads an image for an animal to Cloudflare R2.
 */
router.post(
  "/animals/:animalId/image",
  asyncHandler(requireAuth),
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
            'No upload file found. Send one file using multipart field name "image".'
          )
        );
    }

    if (!ALLOWED_MIME_TYPES.has(req.file.mimetype)) {
      return res
        .status(415)
        .json(
          getErrorPayload(
            "INVALID_IMAGE_TYPE",
            `Unsupported content type "${req.file.mimetype}". Allowed types: ${ALLOWED_MIME_TYPES_ARRAY.join(", ")}.`
          )
        );
    }

    if (!isR2Configured) {
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

    if (!isPublicObjectUrlConfigured) {
      return res
        .status(500)
        .json(
          getErrorPayload(
            "R2_PUBLIC_URL_NOT_CONFIGURED",
            "R2_PUBLIC_BASE_URL must be configured for persistent animal image uploads.",
            { missingEnvVars: missingPublicObjectUrlEnvVars }
          )
        );
    }

    try {
      const result = await uploadAnimalImage(
        animalId,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      return res.status(201).json({ data: result });
    } catch (error) {
      if (isR2DependencyError(error)) {
        return res
          .status(error.statusCode)
          .json(getErrorPayload(error.code, error.message));
      }

      return next(error);
    }
  }
);

/**
 * POST /api/uploads/posts/:postId/image
 * Uploads an image for a post to Cloudflare R2.
 */
router.post(
  "/posts/:postId/image",
  asyncHandler(requireAuth),
  upload.single("image"),
  async (req, res, next) => {
    const postId = String(req.params.postId || "").trim();

    if (!POST_ID_PATTERN.test(postId)) {
      return res
        .status(400)
        .json(
          getErrorPayload(
            "INVALID_POST_ID",
            "postId must be 1-64 chars using only letters, numbers, underscores, or dashes."
          )
        );
    }

    if (!req.file) {
      return res
        .status(400)
        .json(
          getErrorPayload(
            "MISSING_IMAGE_FILE",
            'No upload file found. Send one file using multipart field name "image".'
          )
        );
    }

    if (!ALLOWED_MIME_TYPES.has(req.file.mimetype)) {
      return res
        .status(415)
        .json(
          getErrorPayload(
            "INVALID_IMAGE_TYPE",
            `Unsupported content type "${req.file.mimetype}". Allowed types: ${ALLOWED_MIME_TYPES_ARRAY.join(", ")}.`
          )
        );
    }

    if (!isR2Configured) {
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

    if (!isPublicObjectUrlConfigured) {
      return res
        .status(500)
        .json(
          getErrorPayload(
            "R2_PUBLIC_URL_NOT_CONFIGURED",
            "R2_PUBLIC_BASE_URL must be configured for persistent post image uploads.",
            { missingEnvVars: missingPublicObjectUrlEnvVars }
          )
        );
    }

    try {
      const result = await uploadPostImage(
        postId,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      return res.status(201).json({ data: result });
    } catch (error) {
      if (isR2DependencyError(error)) {
        return res
          .status(error.statusCode)
          .json(getErrorPayload(error.code, error.message));
      }

      return next(error);
    }
  }
);

// Multer error handler (must be registered on this router)
router.use((error, req, res, next) => {
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

  return next(error);
});

module.exports = router;
