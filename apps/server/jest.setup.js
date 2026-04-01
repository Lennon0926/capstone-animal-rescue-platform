// Set required environment variables for tests.
// Actual external services (Supabase, R2) are mocked in individual test files,
// so these are placeholder values that satisfy validateEnv() only.
process.env.PORT = process.env.PORT || "4000";
process.env.SUPABASE_URL =
  process.env.SUPABASE_URL || "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "test-service-role-key";
process.env.R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "test-account-id";
process.env.R2_ACCESS_KEY_ID =
  process.env.R2_ACCESS_KEY_ID || "test-access-key-id";
process.env.R2_SECRET_ACCESS_KEY =
  process.env.R2_SECRET_ACCESS_KEY || "test-secret-access-key";
process.env.R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "test-bucket";
process.env.R2_PUBLIC_BASE_URL =
  process.env.R2_PUBLIC_BASE_URL || "https://pub-test-bucket.r2.dev";
