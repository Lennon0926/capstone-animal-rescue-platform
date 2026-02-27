const REQUIRED_ENV_VARS = ["PORT"];

function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error("FATAL: Missing required environment variables:");
    missing.forEach((key) => console.error(`  - ${key}`));
    console.error("Server cannot start. Please set them in .env.local");
    process.exit(1);
  }
}

module.exports = { validateEnv, REQUIRED_ENV_VARS };
