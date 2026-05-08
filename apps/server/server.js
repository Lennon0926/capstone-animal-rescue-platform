const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const { rateLimit } = require("express-rate-limit");

dotenv.config({
  path: path.resolve(__dirname, ".env.local"),
  quiet: process.env.NODE_ENV === "test",
});
const { validateEnv } = require("./validateEnv");

validateEnv();

const healthRouter = require("./routes/health");
const animalsRouter = require("./routes/animals");
const uploadsRouter = require("./routes/uploads");
const usersRouter = require("./routes/users");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const app = express();
const port = Number(process.env.PORT) || 4000;

const rateLimitHandler = (req, res) =>
  res.status(429).json({
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests, please try again later.",
    },
  });

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: rateLimitHandler,
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: rateLimitHandler,
});

app.set("trust proxy", 1);

// Middleware
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean) ?? [],
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(globalLimiter);
app.use(express.json());

// Routes
app.use("/api/animals", animalsRouter);
app.use("/api/users", usersRouter);
app.post("/api/uploads/animals/:animalId/image", uploadLimiter);
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
