const request = require("supertest");

const mockAuthGetUser = jest.fn();
const mockVerifyConnection = jest.fn();

jest.mock("../lib/supabase", () => ({
  getSupabaseClient: () => ({
    auth: {
      getUser: mockAuthGetUser,
    },
  }),
  verifyConnection: (...args) => mockVerifyConnection(...args),
}));

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

beforeAll(() => {
  process.env.PORT = "4000";
});

afterAll(() => {
  console.error.mockRestore();
});

const getApp = () => require("../server");
const asAuthenticated = (req) =>
  req.set("Authorization", "Bearer test-auth-token");

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthGetUser.mockResolvedValue({
    data: { user: { id: "test-user-id" } },
    error: null,
  });
  mockVerifyConnection.mockResolvedValue({ connected: true });
});

describe("GET /", () => {
  it("returns the platform welcome message", async () => {
    const res = await request(getApp()).get("/");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toMatch(/capstone animal rescue/i);
  });
});

describe("GET /health", () => {
  it("returns status ok with uptime and startedAt", async () => {
    const res = await request(getApp()).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body).toHaveProperty("uptime");
    expect(res.body).toHaveProperty("startedAt");
  });
});

describe("GET /ready", () => {
  it("returns ready when required env vars are set", async () => {
    const res = await request(getApp()).get("/ready");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ready");
  });
});

describe("GET /api/uploads/config", () => {
  it("returns upload configuration", async () => {
    const res = await request(getApp()).get("/api/uploads/config");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("allowedMimeTypes");
    expect(res.body.data).toHaveProperty("maxImageSizeBytes");
    expect(res.body.data.publicObjectUrlConfigured).toBe(true);
    expect(res.body.data).not.toHaveProperty("signedReadUrlTtlSeconds");
    expect(res.body.data.allowedMimeTypes).toEqual(
      expect.arrayContaining(["image/jpeg", "image/png", "image/webp"])
    );
  });
});

describe("POST /api/uploads/animals/:animalId/image", () => {
  it("rejects requests without authentication", async () => {
    const res = await request(getApp())
      .post("/api/uploads/animals/test-animal-1/image")
      .attach("image", Buffer.from("fake"), {
        filename: "test.jpg",
        contentType: "image/jpeg",
      });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/authentication required/i);
  });

  it("rejects requests with invalid animalId", async () => {
    const res = await asAuthenticated(
      request(getApp()).post("/api/uploads/animals/!!invalid!!/image")
    )
      .attach("image", Buffer.from("fake"), {
        filename: "test.jpg",
        contentType: "image/jpeg",
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_ANIMAL_ID");
  });

  it("rejects requests with no file attached", async () => {
    const res = await asAuthenticated(
      request(getApp()).post("/api/uploads/animals/test-animal-1/image")
    );
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("MISSING_IMAGE_FILE");
  });

  it("rejects files with unsupported MIME type", async () => {
    const res = await asAuthenticated(
      request(getApp()).post("/api/uploads/animals/test-animal-1/image")
    )
      .attach("image", Buffer.from("fake"), {
        filename: "test.gif",
        contentType: "image/gif",
      });
    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe("INVALID_IMAGE_TYPE");
  });
});
