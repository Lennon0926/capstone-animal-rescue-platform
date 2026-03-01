/**
 * Swagger/OpenAPI Configuration
 * Configures OpenAPI 3.0 specification for API documentation.
 */

const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Capstone Animal Rescue Platform API",
      version: "1.0.0",
      description:
        "API documentation for the Capstone Animal Rescue Platform. This API provides endpoints for managing animals, handling image uploads, and health monitoring.",
      contact: {
        name: "API Support",
        url: "https://github.com/Lennon0926/capstone-animal-rescue-platform",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Development server",
      },
    ],
    tags: [
      {
        name: "Animals",
        description: "Animal management endpoints",
      },
      {
        name: "Uploads",
        description: "Image upload endpoints for animal photos",
      },
      {
        name: "Health",
        description: "Health check and readiness endpoints",
      },
    ],
    components: {
      schemas: {
        Animal: {
          type: "object",
          properties: {
            aid: {
              type: "string",
              description: "Unique animal identifier",
              example: "dog-001",
            },
            name: {
              type: "string",
              description: "Animal name",
              example: "Buddy",
            },
            species: {
              type: "string",
              description: "Animal species",
              example: "Dog",
            },
            breed: {
              type: "string",
              description: "Animal breed",
              example: "Golden Retriever",
            },
            age: {
              type: "integer",
              description: "Animal age in years",
              example: 3,
            },
            gender: {
              type: "string",
              enum: ["male", "female", "unknown"],
              description: "Animal gender",
              example: "male",
            },
            size: {
              type: "string",
              enum: ["small", "medium", "large", "extra_large"],
              description: "Animal size category",
              example: "large",
            },
            status: {
              type: "string",
              enum: ["available", "adopted", "pending", "fostered", "medical_hold"],
              description: "Adoption status",
              example: "available",
            },
            description: {
              type: "string",
              description: "Animal description",
              example: "Friendly and energetic dog looking for a loving home.",
            },
            image_url: {
              type: "string",
              format: "uri",
              description: "URL to animal's primary image",
              example: "https://example.com/images/buddy.jpg",
            },
            created_at: {
              type: "string",
              format: "date-time",
              description: "Record creation timestamp",
              example: "2024-01-15T10:30:00Z",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              description: "Record last update timestamp",
              example: "2024-01-20T14:45:00Z",
            },
          },
        },
        AnimalListResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            data: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Animal",
              },
            },
            pagination: {
              type: "object",
              properties: {
                total: {
                  type: "integer",
                  description: "Total number of animals matching the query",
                  example: 150,
                },
                limit: {
                  type: "integer",
                  description: "Number of records per page",
                  example: 50,
                },
                offset: {
                  type: "integer",
                  description: "Number of records skipped",
                  example: 0,
                },
                hasMore: {
                  type: "boolean",
                  description: "Whether more records are available",
                  example: true,
                },
              },
            },
          },
        },
        AnimalDetailResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            data: {
              $ref: "#/components/schemas/Animal",
            },
          },
        },
        FilterOptions: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            data: {
              type: "object",
              properties: {
                species: {
                  type: "array",
                  items: { type: "string" },
                  example: ["Dog", "Cat", "Rabbit"],
                },
                status: {
                  type: "array",
                  items: { type: "string" },
                  example: ["available", "adopted", "pending"],
                },
                size: {
                  type: "array",
                  items: { type: "string" },
                  example: ["small", "medium", "large"],
                },
                gender: {
                  type: "array",
                  items: { type: "string" },
                  example: ["male", "female", "unknown"],
                },
              },
            },
          },
        },
        UploadConfig: {
          type: "object",
          properties: {
            data: {
              type: "object",
              properties: {
                r2Configured: {
                  type: "boolean",
                  description: "Whether R2 storage is configured",
                  example: true,
                },
                missingEnvVars: {
                  type: "array",
                  items: { type: "string" },
                  description: "List of missing environment variables (if any)",
                  example: [],
                },
                allowedMimeTypes: {
                  type: "array",
                  items: { type: "string" },
                  description: "Allowed image MIME types",
                  example: ["image/jpeg", "image/png", "image/webp"],
                },
                maxImageSizeBytes: {
                  type: "integer",
                  description: "Maximum allowed image size in bytes",
                  example: 5242880,
                },
                signedReadUrlTtlSeconds: {
                  type: "integer",
                  description: "TTL for signed read URLs in seconds",
                  example: 3600,
                },
              },
            },
          },
        },
        UploadResponse: {
          type: "object",
          properties: {
            data: {
              type: "object",
              properties: {
                objectKey: {
                  type: "string",
                  description: "Storage object key",
                  example: "animals/dog-001/1705320000000-photo.jpg",
                },
                url: {
                  type: "string",
                  format: "uri",
                  description: "URL to access the uploaded image",
                  example: "https://example.com/animals/dog-001/photo.jpg",
                },
                urlType: {
                  type: "string",
                  enum: ["public", "signed-read"],
                  description: "Type of URL returned",
                  example: "public",
                },
                contentType: {
                  type: "string",
                  description: "MIME type of uploaded file",
                  example: "image/jpeg",
                },
                size: {
                  type: "integer",
                  description: "File size in bytes",
                  example: 256000,
                },
              },
            },
          },
        },
        HealthResponse: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["ok", "healthy", "degraded"],
              example: "ok",
            },
            uptime: {
              type: "number",
              description: "Server uptime in seconds",
              example: 3600.5,
            },
            startedAt: {
              type: "string",
              format: "date-time",
              example: "2024-01-15T08:00:00Z",
            },
          },
        },
        HealthWithDbResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            status: {
              type: "string",
              enum: ["healthy", "degraded"],
              example: "healthy",
            },
            timestamp: {
              type: "string",
              format: "date-time",
              example: "2024-01-15T10:30:00Z",
            },
            database: {
              type: "object",
              properties: {
                connected: {
                  type: "boolean",
                  example: true,
                },
                error: {
                  type: "string",
                  nullable: true,
                  example: null,
                },
              },
            },
          },
        },
        ReadyResponse: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["ready", "not ready"],
              example: "ready",
            },
            reason: {
              type: "string",
              description: "Reason if not ready",
              example: "missing env",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                code: {
                  type: "string",
                  description: "Error code",
                  example: "VALIDATION_ERROR",
                },
                message: {
                  type: "string",
                  description: "Error message",
                  example: "Invalid request parameters",
                },
                details: {
                  type: "object",
                  description: "Additional error details",
                  additionalProperties: true,
                },
              },
            },
          },
        },
        ApiError: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                  example: "Resource not found",
                },
                code: {
                  type: "string",
                  example: "NOT_FOUND",
                },
              },
            },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT Authorization header (placeholder for future protected routes)",
        },
      },
    },
  },
  apis: [
    "./server.js",
    "./routes/*.js",
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec };
