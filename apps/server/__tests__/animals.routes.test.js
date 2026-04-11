const request = require("supertest");

const MOCK_ANIMALS = [
  {
    aid: 1,
    name: "Buddy",
    species: "Dog",
    status: "available",
    size: "medium",
    gender: "male",
    image_object_key: "animals/1/123-photo.jpg",
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    aid: 2,
    name: "Whiskers",
    species: "Cat",
    status: "adopted",
    size: "small",
    gender: "female",
    created_at: "2025-02-01T00:00:00Z",
  },
];

const mockSelect = jest.fn();
const mockFrom = jest.fn(() => ({ select: mockSelect }));
const mockRpc = jest.fn();
const mockSupabaseClient = { from: mockFrom, rpc: mockRpc };

jest.mock("../lib/supabase", () => ({
  getSupabaseClient: () => mockSupabaseClient,
  verifyConnection: () => Promise.resolve({ connected: true }),
}));

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  process.env.PORT = "4000";
});

afterAll(() => {
  console.error.mockRestore();
});

const getApp = () => require("../server");

function buildChainableMock(resolvedValue) {
  const chain = {};
  const methods = ["select", "eq", "ilike", "not", "order", "range", "single", "limit"];
  for (const m of methods) {
    chain[m] = jest.fn(() => chain);
  }
  chain.then = (resolve) => resolve(resolvedValue);
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
  require("../repositories/animalsRepository").clearAnimalsCache();
});

describe("GET /api/animals", () => {
  it("returns a paginated list of animals", async () => {
    const chain = buildChainableMock({
      data: MOCK_ANIMALS,
      error: null,
      count: 2,
    });
    mockFrom.mockReturnValue(chain);

    const res = await request(getApp()).get("/api/animals");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].image_object_key).toBe("animals/1/123-photo.jpg");
    expect(res.body.data[0].image_url).toBe(
      "https://pub-test-bucket.r2.dev/animals/1/123-photo.jpg"
    );
    expect(res.body.pagination).toMatchObject({
      total: 2,
      limit: 50,
      offset: 0,
    });
  });

  it("accepts valid query parameters for filtering", async () => {
    const chain = buildChainableMock({
      data: [MOCK_ANIMALS[0]],
      error: null,
      count: 1,
    });
    mockFrom.mockReturnValue(chain);

    const res = await request(getApp())
      .get("/api/animals")
      .query({ species: "Dog", status: "available", limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination.limit).toBe(10);
  });

  it("returns 500 when database returns an error", async () => {
    const chain = buildChainableMock({
      data: null,
      error: { message: "DB connection failed" },
      count: 0,
    });
    mockFrom.mockReturnValue(chain);

    const res = await request(getApp()).get("/api/animals");
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe("GET /api/animals/filters", () => {
  it("returns distinct filter values", async () => {
    mockRpc.mockResolvedValue({
      data: {
        species: ["gato", "perro"],
        status: ["adoptado", "disponible"],
        size: ["grande", "mediano"],
        gender: ["hembra", "macho"],
      },
      error: null,
    });

    const res = await request(getApp()).get("/api/animals/filters");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("species");
    expect(res.body.data).toHaveProperty("status");
    expect(res.body.data).toHaveProperty("size");
    expect(res.body.data).toHaveProperty("gender");
  });
});

describe("GET /api/animals/:aid", () => {
  it("returns a single animal by ID", async () => {
    const chain = buildChainableMock({
      data: MOCK_ANIMALS[0],
      error: null,
    });
    mockFrom.mockReturnValue(chain);

    const res = await request(getApp()).get("/api/animals/1");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Buddy");
  });

  it("returns 404 when animal is not found", async () => {
    const chain = buildChainableMock({
      data: null,
      error: { code: "PGRST116", message: "not found" },
    });
    mockFrom.mockReturnValue(chain);

    const res = await request(getApp()).get("/api/animals/999");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 for an invalid animal ID", async () => {
    const res = await request(getApp()).get("/api/animals/abc");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/invalid animal id/i);
  });

  it("returns 400 for negative animal ID", async () => {
    const res = await request(getApp()).get("/api/animals/-5");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe("404 handler", () => {
  it("returns 404 for undefined routes", async () => {
    const res = await request(getApp()).get("/api/nonexistent");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/route not found/i);
  });
});
