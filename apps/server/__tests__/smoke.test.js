const request = require("supertest");

const MOCK_ANIMALS = [
  {
    aid: 1,
    name: "Buddy",
    species: "Dog",
    status: "available",
    size: "medium",
    gender: "male",
    created_at: "2025-01-01T00:00:00Z",
  },
];

function buildChainableMock(resolvedValue) {
  const chain = {};
  const methods = ["select", "eq", "ilike", "not", "order", "range", "single", "limit"];
  for (const m of methods) {
    chain[m] = jest.fn(() => chain);
  }
  chain.then = (resolve) => resolve(resolvedValue);
  return chain;
}

const mockFrom = jest.fn();
const mockVerifyConnection = jest.fn();

jest.mock("../lib/supabase", () => ({
  getSupabaseClient: () => ({ from: mockFrom }),
  verifyConnection: (...args) => mockVerifyConnection(...args),
}));

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  process.env.PORT = "4000";
});

afterAll(() => {
  console.error.mockRestore();
});

beforeEach(() => {
  jest.clearAllMocks();
  mockVerifyConnection.mockResolvedValue({ connected: true });
});

const getApp = () => require("../server");

describe("GET /api/health", () => {
  it("returns 200 with healthy status when database is connected", async () => {
    const app = getApp();

    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe("healthy");
    expect(res.body.database.connected).toBe(true);
    expect(res.body.database.error).toBeNull();
    expect(res.body).toHaveProperty("timestamp");
  });

  it("returns 503 with degraded status when database is not connected", async () => {
    mockVerifyConnection.mockResolvedValue({
      connected: false,
      error: "Connection refused",
    });
    const app = getApp();

    const res = await request(app).get("/api/health");
    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.status).toBe("degraded");
    expect(res.body.database.connected).toBe(false);
    expect(res.body.database.error).toBe("Connection refused");
  });
});

describe("Smoke: core animal flow", () => {
  it("server is healthy and ready", async () => {
    const app = getApp();

    const health = await request(app).get("/health");
    expect(health.status).toBe(200);
    expect(health.body.status).toBe("ok");

    const ready = await request(app).get("/ready");
    expect(ready.status).toBe(200);
    expect(ready.body.status).toBe("ready");
  });

  it("upload config is accessible and lists allowed image types", async () => {
    const app = getApp();

    const config = await request(app).get("/api/uploads/config");
    expect(config.status).toBe(200);
    expect(config.body.data.publicObjectUrlConfigured).toBe(true);
    expect(config.body.data.allowedMimeTypes).toContain("image/jpeg");
    expect(config.body.data.maxImageSizeBytes).toBeGreaterThan(0);
  });

  it("animal image upload rejects invalid input and accepts valid input shape", async () => {
    const app = getApp();

    const noFile = await request(app).post(
      "/api/uploads/animals/smoke-test-1/image"
    );
    expect(noFile.status).toBe(400);
    expect(noFile.body.error.code).toBe("MISSING_IMAGE_FILE");

    const badType = await request(app)
      .post("/api/uploads/animals/smoke-test-1/image")
      .attach("image", Buffer.from("fake-image-bytes"), {
        filename: "test.bmp",
        contentType: "image/bmp",
      });
    expect(badType.status).toBe(415);
    expect(badType.body.error.code).toBe("INVALID_IMAGE_TYPE");

    const badId = await request(app)
      .post("/api/uploads/animals/!!!/image")
      .attach("image", Buffer.from("fake"), {
        filename: "test.jpg",
        contentType: "image/jpeg",
      });
    expect(badId.status).toBe(400);
    expect(badId.body.error.code).toBe("INVALID_ANIMAL_ID");
  });

  it("animal fetch: list animals, then fetch a single animal by ID", async () => {
    const app = getApp();

    const listChain = buildChainableMock({
      data: MOCK_ANIMALS,
      error: null,
      count: 1,
    });
    mockFrom.mockReturnValue(listChain);

    const list = await request(app).get("/api/animals");
    expect(list.status).toBe(200);
    expect(list.body.success).toBe(true);
    expect(Array.isArray(list.body.data)).toBe(true);
    expect(list.body.data.length).toBeGreaterThan(0);
    expect(list.body.pagination).toBeDefined();

    const firstAnimalId = list.body.data[0].aid;

    const singleChain = buildChainableMock({
      data: MOCK_ANIMALS[0],
      error: null,
    });
    mockFrom.mockReturnValue(singleChain);

    const detail = await request(app).get(`/api/animals/${firstAnimalId}`);
    expect(detail.status).toBe(200);
    expect(detail.body.success).toBe(true);
    expect(detail.body.data.aid).toBe(firstAnimalId);
    expect(detail.body.data.name).toBeDefined();
  });

  it("animal fetch: invalid ID returns 400", async () => {
    const app = getApp();

    const res = await request(app).get("/api/animals/not-a-number");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("undefined routes return 404 with structured error", async () => {
    const app = getApp();

    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/route not found/i);
  });
});
