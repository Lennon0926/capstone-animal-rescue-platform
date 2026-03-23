const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");

dotenv.config({ path: path.resolve(__dirname, ".env.local") });
const { validateEnv } = require("./validateEnv");

validateEnv();

const healthRouter = require("./routes/health");
const animalsRouter = require("./routes/animals");
const uploadsRouter = require("./routes/uploads");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const app = express();
const port = Number(process.env.PORT) || 4000;

// Middleware
app.use(cors());
app.use(express.json());

<<<<<<< HEAD
// Swagger UI - only enabled in non-production environments
if (process.env.NODE_ENV !== "production") {
  const swaggerUi = require("swagger-ui-express");
  const { swaggerSpec } = require("./config/swagger");

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: "Animal Rescue API Documentation",
  }));

  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
}

/**
 * @swagger
 * /:
 *   get:
 *     summary: API Root
 *     description: Returns API information and available endpoints
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Capstone Animal Rescue Platform API
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     animals:
 *                       type: string
 *                       example: /api/animals
 *                     health:
 *                       type: string
 *                       example: /api/health
 */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Capstone Animal Rescue Platform API",
    version: "1.0.0",
    endpoints: {
      animals: "/api/animals",
      health: "/api/health",
    },
  });
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check with database status
 *     description: Returns server health status including database connection status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthWithDbResponse'
 *       503:
 *         description: Server is degraded (database connection issue)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthWithDbResponse'
 */
app.get("/api/health", async (req, res) => {
  const dbStatus = await verifyConnection();

  res.status(dbStatus.connected ? 200 : 503).json({
    success: dbStatus.connected,
    status: dbStatus.connected ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    database: {
      connected: dbStatus.connected,
      error: dbStatus.error || null,
    },
  });
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Simple health check
 *     description: Returns basic server health status with uptime
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), startedAt });
});

/**
 * @swagger
 * /ready:
 *   get:
 *     summary: Readiness check
 *     description: Checks if all required environment variables are configured and server is ready to accept traffic
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is ready
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReadyResponse'
 *       503:
 *         description: Server is not ready
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReadyResponse'
 */
app.get("/ready", (req, res) => {
  const envReady = REQUIRED_ENV_VARS.every((key) => !!process.env[key]);

  if (!envReady) {
    return res.status(503).json({ status: "not ready", reason: "missing env" });
  }

  res.json({ status: "ready" });
});

/**
 * @swagger
 * /api/uploads/config:
 *   get:
 *     summary: Get upload configuration
 *     description: Returns upload configuration including allowed file types and size limits
 *     tags: [Uploads]
 *     responses:
 *       200:
 *         description: Upload configuration
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadConfig'
 */
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

/**
 * @swagger
 * /api/uploads/animals/{animalId}/image:
 *   post:
 *     summary: Upload animal image
 *     description: Upload an image for a specific animal. Images are stored in Cloudflare R2.
 *     tags: [Uploads]
 *     parameters:
 *       - in: path
 *         name: animalId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-zA-Z0-9_-]{1,64}$'
 *         description: Animal ID (1-64 alphanumeric chars, underscores, or dashes)
 *         example: dog-001
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, or WebP)
 *     responses:
 *       201:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadResponse'
 *       400:
 *         description: Invalid request (missing file or invalid animal ID)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalidAnimalId:
 *                 summary: Invalid animal ID
 *                 value:
 *                   error:
 *                     code: INVALID_ANIMAL_ID
 *                     message: "animalId must be 1-64 chars using only letters, numbers, underscores, or dashes."
 *               missingFile:
 *                 summary: Missing image file
 *                 value:
 *                   error:
 *                     code: MISSING_IMAGE_FILE
 *                     message: 'No upload file found. Send one file using multipart field name "image".'
 *       413:
 *         description: Image file too large
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error:
 *                 code: IMAGE_TOO_LARGE
 *                 message: "Image exceeds the 5242880 byte upload limit."
 *       415:
 *         description: Unsupported media type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error:
 *                 code: INVALID_IMAGE_TYPE
 *                 message: "Unsupported content type. Allowed types: image/jpeg, image/png, image/webp."
 *       500:
 *         description: Server error or R2 not configured
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

// Multer error handler
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

// Routes
app.use("/api/animals", animalsRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/", healthRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
  const server = app.listen(port, () => {
    console.log(`Server started on port ${port}`);
    console.log(`Health check: http://localhost:${port}/api/health`);
    console.log(`Animals API: http://localhost:${port}/api/animals`);
    if (process.env.NODE_ENV !== "production") {
      console.log(`API Documentation: http://localhost:${port}/api-docs`);
    }
  });

  const shutdown = (signal) => {
    console.log(`\n${signal} received, shutting down gracefully...`);
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
    setTimeout(() => {
      console.error("Forcing shutdown after timeout");
      process.exit(1);
    }, 5000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

module.exports = app;
