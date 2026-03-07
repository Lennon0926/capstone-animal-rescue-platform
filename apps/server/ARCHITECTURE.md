# Server Architecture

The backend is organized into focused modules. `server.js` is the thin entry point — it wires up middleware and mounts routers, but contains no business logic.

## Directory Layout

```
apps/server/
├── server.js               # Entry point: env setup, middleware, route mounting
├── validateEnv.js          # Required environment variable definitions and validation
│
├── routes/                 # Express routers — one file per feature area
│   ├── animals.js          # GET /api/animals, GET /api/animals/filters, GET /api/animals/:aid
│   ├── uploads.js          # GET /api/uploads/config, POST /api/uploads/animals/:id/image
│   └── health.js           # GET /, GET /api/health, GET /health, GET /ready
│
├── middleware/             # Express middleware
│   ├── errorHandler.js     # ApiError class, errorHandler, notFoundHandler, asyncHandler
│   └── validation.js       # Request parameter validation for animals endpoints
│
├── services/               # Business logic and external integrations
│   └── r2Service.js        # Cloudflare R2 client, image upload, URL generation
│
├── repositories/           # Data access layer (database queries only)
│   └── animalsRepository.js # getAnimals, getAnimalById, getDistinctValues
│
└── lib/                    # Shared utilities and client wrappers
    └── supabase.js         # Supabase singleton client, verifyConnection
```

## Request Flow

```
HTTP Request
    └── server.js (cors, express.json)
        └── Router (routes/*.js)
            └── Middleware (middleware/validation.js)
                └── Route Handler
                    ├── Service (services/*.js)     — for external integrations
                    └── Repository (repositories/) — for database access
                        └── lib/supabase.js
```

## Adding a New Feature

1. Create `routes/<feature>.js` with an Express router.
2. If the feature touches an external service, add `services/<feature>Service.js`.
3. If the feature needs database access, add `repositories/<feature>Repository.js`.
4. Mount the router in `server.js` with `app.use("/api/<feature>", featureRouter)`.

## Error Handling

All routes should use `asyncHandler` from `middleware/errorHandler.js` to wrap async handlers. Throw `ApiError` for expected errors. Unexpected errors bubble up to the global `errorHandler` middleware registered in `server.js`.
