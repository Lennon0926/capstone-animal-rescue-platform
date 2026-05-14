const request = require("supertest");

const mockAuthGetUser = jest.fn();
const mockCheckR2Health = jest.fn();
const mockUploadAnimalImage = jest.fn();
const mockUploadPostImage = jest.fn();

function freshApp({ r2Configured = true, publicUrlConfigured = true } = {}) {
  jest.resetModules();

  // jest.doMock is not babel-hoisted — can access closure vars
  jest.doMock("../lib/supabase", () => ({
    getSupabaseClient: () => ({ auth: { getUser: mockAuthGetUser } }),
    verifyConnection: () => Promise.resolve({ connected: true }),
  }));

  jest.doMock("../services/r2Service", () => ({
    ALLOWED_MIME_TYPES: new Set(["image/jpeg", "image/png", "image/webp"]),
    ANIMAL_ID_PATTERN: /^[a-zA-Z0-9_-]{1,64}$/,
    POST_ID_PATTERN: /^[a-zA-Z0-9_-]{1,64}$/,
    maxImageSizeBytes: 10 * 1024 * 1024,
    isR2Configured: r2Configured,
    missingR2EnvVars: r2Configured ? [] : ["R2_ACCOUNT_ID"],
    isPublicObjectUrlConfigured: publicUrlConfigured,
    missingPublicObjectUrlEnvVars: publicUrlConfigured ? [] : ["R2_PUBLIC_BASE_URL"],
    checkR2Health: (...args) => mockCheckR2Health(...args),
    isR2DependencyError: (err) => err?._isR2DependencyError === true,
    uploadAnimalImage: (...args) => mockUploadAnimalImage(...args),
    uploadPostImage: (...args) => mockUploadPostImage(...args),
  }));

  return require("../server");
}

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  process.env.PORT = "4000";
  process.env.SUPABASE_URL = "http://localhost";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
});

afterAll(() => {
  console.error.mockRestore();
  console.warn.mockRestore();
});

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthGetUser.mockResolvedValue({
    data: { user: { id: "test-user-id" } },
    error: null,
  });
  mockCheckR2Health.mockResolvedValue({
    ok: true, code: "R2_OK", message: "healthy", checkedAt: new Date().toISOString(),
  });
});

const fakeImage = Buffer.from("fake-image-data");

// ── GET /api/uploads/config ───────────────────────────────────────────────────

describe("GET /api/uploads/config", () => {
  it("returns upload config when R2 is fully configured", async () => {
    const res = await request(freshApp()).get("/api/uploads/config");
    expect(res.status).toBe(200);
    expect(res.body.data.r2Configured).toBe(true);
    expect(res.body.data.health.ok).toBe(true);
    expect(Array.isArray(res.body.data.allowedMimeTypes)).toBe(true);
  });

  it("returns missingEnvVars when R2 not configured", async () => {
    const res = await request(freshApp({ r2Configured: false })).get("/api/uploads/config");
    expect(res.status).toBe(200);
    expect(res.body.data.r2Configured).toBe(false);
    expect(res.body.data.missingEnvVars).toContain("R2_ACCOUNT_ID");
  });

  it("returns 500 when health check throws", async () => {
    mockCheckR2Health.mockRejectedValue(new Error("R2 unavailable"));
    const res = await request(freshApp()).get("/api/uploads/config");
    expect(res.status).toBe(500);
  });
});

// ── POST /api/uploads/animals/:animalId/image ─────────────────────────────────

describe("POST /api/uploads/animals/:animalId/image", () => {
  it("returns 401 without auth token", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: new Error("unauth") });
    const res = await request(freshApp())
      .post("/api/uploads/animals/123/image")
      .attach("image", fakeImage, { filename: "test.jpg", contentType: "image/jpeg" });
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid animalId (contains space)", async () => {
    const res = await request(freshApp())
      .post("/api/uploads/animals/bad id/image")
      .set("Authorization", "Bearer test-token")
      .attach("image", fakeImage, { filename: "test.jpg", contentType: "image/jpeg" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_ANIMAL_ID");
  });

  it("returns 400 when no file is uploaded", async () => {
    const res = await request(freshApp())
      .post("/api/uploads/animals/123/image")
      .set("Authorization", "Bearer test-token");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("MISSING_IMAGE_FILE");
  });

  it("returns 415 for unsupported mime type", async () => {
    const res = await request(freshApp())
      .post("/api/uploads/animals/123/image")
      .set("Authorization", "Bearer test-token")
      .attach("image", fakeImage, { filename: "test.gif", contentType: "image/gif" });
    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe("INVALID_IMAGE_TYPE");
  });

  it("returns 500 when R2 not configured", async () => {
    const res = await request(freshApp({ r2Configured: false }))
      .post("/api/uploads/animals/123/image")
      .set("Authorization", "Bearer test-token")
      .attach("image", fakeImage, { filename: "test.jpg", contentType: "image/jpeg" });
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("R2_NOT_CONFIGURED");
  });

  it("returns 500 when public URL not configured", async () => {
    const res = await request(freshApp({ publicUrlConfigured: false }))
      .post("/api/uploads/animals/123/image")
      .set("Authorization", "Bearer test-token")
      .attach("image", fakeImage, { filename: "test.jpg", contentType: "image/jpeg" });
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("R2_PUBLIC_URL_NOT_CONFIGURED");
  });

  it("returns 201 with upload result on success", async () => {
    mockUploadAnimalImage.mockResolvedValue({
      objectKey: "animals/123/ts-test.jpg",
      url: "https://pub.r2.dev/animals/123/ts-test.jpg",
      urlType: "public",
      contentType: "image/jpeg",
      size: fakeImage.length,
    });
    const res = await request(freshApp())
      .post("/api/uploads/animals/123/image")
      .set("Authorization", "Bearer test-token")
      .attach("image", fakeImage, { filename: "test.jpg", contentType: "image/jpeg" });
    expect(res.status).toBe(201);
    expect(res.body.data.objectKey).toBe("animals/123/ts-test.jpg");
  });

  it("returns R2 dependency error status when upload fails with known error", async () => {
    const r2Error = { _isR2DependencyError: true, statusCode: 503, code: "R2_UNAVAILABLE", message: "R2 down" };
    mockUploadAnimalImage.mockRejectedValue(r2Error);
    const res = await request(freshApp())
      .post("/api/uploads/animals/123/image")
      .set("Authorization", "Bearer test-token")
      .attach("image", fakeImage, { filename: "test.jpg", contentType: "image/jpeg" });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("R2_UNAVAILABLE");
  });

  it("returns 500 on unexpected upload error", async () => {
    mockUploadAnimalImage.mockRejectedValue(new Error("Unexpected"));
    const res = await request(freshApp())
      .post("/api/uploads/animals/123/image")
      .set("Authorization", "Bearer test-token")
      .attach("image", fakeImage, { filename: "test.jpg", contentType: "image/jpeg" });
    expect(res.status).toBe(500);
  });
});

// ── POST /api/uploads/posts/:postId/image ─────────────────────────────────────

describe("POST /api/uploads/posts/:postId/image", () => {
  it("returns 401 without auth", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: new Error("unauth") });
    const res = await request(freshApp())
      .post("/api/uploads/posts/post-1/image")
      .attach("image", fakeImage, { filename: "cover.png", contentType: "image/png" });
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid postId (special char)", async () => {
    const res = await request(freshApp())
      .post("/api/uploads/posts/bad!id/image")
      .set("Authorization", "Bearer test-token")
      .attach("image", fakeImage, { filename: "cover.png", contentType: "image/png" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_POST_ID");
  });

  it("returns 400 when no file", async () => {
    const res = await request(freshApp())
      .post("/api/uploads/posts/post-1/image")
      .set("Authorization", "Bearer test-token");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("MISSING_IMAGE_FILE");
  });

  it("returns 415 for unsupported mime type", async () => {
    const res = await request(freshApp())
      .post("/api/uploads/posts/post-1/image")
      .set("Authorization", "Bearer test-token")
      .attach("image", fakeImage, { filename: "file.bmp", contentType: "image/bmp" });
    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe("INVALID_IMAGE_TYPE");
  });

  it("returns 201 with upload result on success", async () => {
    mockUploadPostImage.mockResolvedValue({
      objectKey: "posts/post-1/ts-cover.png",
      url: "https://pub.r2.dev/posts/post-1/ts-cover.png",
      urlType: "public",
      contentType: "image/png",
      size: fakeImage.length,
    });
    const res = await request(freshApp())
      .post("/api/uploads/posts/post-1/image")
      .set("Authorization", "Bearer test-token")
      .attach("image", fakeImage, { filename: "cover.png", contentType: "image/png" });
    expect(res.status).toBe(201);
    expect(res.body.data.objectKey).toBe("posts/post-1/ts-cover.png");
  });
});
