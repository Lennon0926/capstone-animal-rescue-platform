jest.mock("../lib/supabase", () => ({
  getSupabaseClient: () => ({ from: jest.fn() }),
  verifyConnection: jest.fn().mockResolvedValue({ connected: true }),
}));

jest.mock("../services/r2Service", () => ({
  ALLOWED_MIME_TYPES: new Set(["image/jpeg"]),
  ANIMAL_ID_PATTERN: /^[a-zA-Z0-9_-]{1,64}$/,
  maxImageSizeBytes: 10485760,
  isR2Configured: false,
  missingR2EnvVars: ["R2_BUCKET"],
  isPublicObjectUrlConfigured: false,
  missingPublicObjectUrlEnvVars: ["R2_PUBLIC_BASE_URL"],
  checkR2Health: jest.fn().mockResolvedValue({ healthy: false }),
  isR2DependencyError: jest.fn().mockReturnValue(false),
  uploadAnimalImage: jest.fn(),
}));

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
});

const request = require("supertest");

describe("Rate limiting", () => {
  let app;

  beforeEach(() => {
    jest.resetModules();
    app = require("../server");
  });

  it("includes RateLimit headers on normal responses", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    // draft-7 format: single combined RateLimit header
    expect(res.headers).toHaveProperty("ratelimit");
    expect(res.headers["ratelimit"]).toMatch(/limit=\d+/);
    expect(res.headers["ratelimit"]).toMatch(/remaining=\d+/);
    expect(res.headers["ratelimit"]).toMatch(/reset=\d+/);
  });

  it("returns 429 with error envelope when global limit is exceeded", async () => {
    const makeRequest = () => request(app).get("/health");

    // Exhaust the limit (100 requests) then check the 101st
    const requests = Array.from({ length: 100 }, makeRequest);
    await Promise.all(requests);

    const res = await makeRequest();
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe("TOO_MANY_REQUESTS");
    expect(res.body.error.message).toBeTruthy();
  });

  it("returns 429 with error envelope on upload endpoint when upload limit exceeded", async () => {
    const makeUpload = () =>
      request(app)
        .post("/api/uploads/animals/test-id/image")
        .attach("image", Buffer.from("fake"), {
          filename: "test.jpg",
          contentType: "image/jpeg",
        });

    // Exhaust the upload limit (10 requests)
    const requests = Array.from({ length: 10 }, makeUpload);
    await Promise.all(requests);

    const res = await makeUpload();
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe("TOO_MANY_REQUESTS");
  });
});
