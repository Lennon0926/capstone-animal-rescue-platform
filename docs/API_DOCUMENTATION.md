# API Documentation (Swagger/OpenAPI)

This document describes the Swagger/OpenAPI integration for the Capstone Animal Rescue Platform API.

## Overview

The API includes interactive documentation using Swagger UI, powered by OpenAPI 3.0 specification.

## Accessing the Documentation

| Environment | URL |
|-------------|-----|
| Development | http://localhost:4000/api-docs |
| JSON Export | http://localhost:4000/api-docs.json |

> **Note:** Swagger UI is disabled in production (`NODE_ENV=production`).

## Documented Endpoints

### Animals
- `GET /api/animals` - List animals with filtering, sorting, and pagination
- `GET /api/animals/filters` - Get available filter options
- `GET /api/animals/:aid` - Get single animal by ID

### Uploads
- `GET /api/uploads/config` - Get upload configuration
- `POST /api/uploads/animals/:animalId/image` - Upload animal image

### Health
- `GET /` - API root information
- `GET /health` - Simple health check
- `GET /ready` - Readiness check
- `GET /api/health` - Health check with database status

## Configuration

### Environment-Based Loading

Swagger is only enabled when `NODE_ENV !== "production"`:

```javascript
if (process.env.NODE_ENV !== "production") {
  const swaggerUi = require("swagger-ui-express");
  const { swaggerSpec } = require("./config/swagger");
  
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api-docs.json", (req, res) => res.send(swaggerSpec));
}
```

### Package Installation

Swagger packages are installed as dev dependencies:

```bash
npm install --save-dev swagger-jsdoc swagger-ui-express
```

## File Structure

```
apps/server/
├── config/
│   └── swagger.js          # OpenAPI specification and schemas
├── routes/
│   └── animals.js          # JSDoc annotations for animal endpoints
└── server.js               # Swagger UI setup and endpoint annotations
```

## Adding New Endpoints

To document a new endpoint, add JSDoc annotations above the route handler:

```javascript
/**
 * @swagger
 * /api/example:
 *   get:
 *     summary: Example endpoint
 *     description: Detailed description
 *     tags: [TagName]
 *     parameters:
 *       - in: query
 *         name: param
 *         schema:
 *           type: string
 *         description: Parameter description
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SchemaName'
 */
app.get("/api/example", (req, res) => { ... });
```

## Schemas

Common schemas are defined in `config/swagger.js`:

- `Animal` - Animal entity
- `AnimalListResponse` - Paginated animal list
- `AnimalDetailResponse` - Single animal response
- `FilterOptions` - Available filter values
- `UploadConfig` - Upload configuration
- `UploadResponse` - Upload result
- `HealthResponse` - Health check response
- `Error` / `ApiError` - Error responses

## Security

A JWT bearer authentication scheme is defined as a placeholder for future protected routes:

```yaml
securitySchemes:
  bearerAuth:
    type: http
    scheme: bearer
    bearerFormat: JWT
```

## Related Issues

- Issue #62: Add Swagger/OpenAPI documentation for API endpoints
