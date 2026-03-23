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
