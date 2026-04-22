const REQUIRED_ENV_VARS = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error("FATAL: Missing required environment variables:");
    missing.forEach((key) => console.error(`  - ${key}`));
    console.error("Server cannot start. Please set them in .env.local");
    process.exit(1);
  }

  if (process.env.NODE_ENV === "production" && !process.env.ALLOWED_ORIGINS) {
    console.error("FATAL: ALLOWED_ORIGINS must be set in production");
    process.exit(1);
  }
}

module.exports = { validateEnv, REQUIRED_ENV_VARS };
