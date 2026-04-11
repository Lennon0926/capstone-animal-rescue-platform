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
  const methods = [
    "select", "eq", "ilike", "not", "order", "range", "single", "limit",
    "insert", "update", "delete", "contains",
  ];
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

describe("POST /api/animals", () => {
  const VALID_CREATE_BODY = {
    name: "Luna",
    description: "Friendly dog looking for a home",
    species: "perro",
    size: "mediano",
    gender: "macho",
    status: "disponible",
  };

  it("creates a new animal and returns 201", async () => {
    const newAnimal = { aid: 3, ...VALID_CREATE_BODY, created_at: "2026-01-01T00:00:00Z" };
    const chain = buildChainableMock({ data: newAnimal, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(getApp()).post("/api/animals").send(VALID_CREATE_BODY);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Luna");
  });

  it("returns 400 when name is missing", async () => {
    const { name, ...body } = VALID_CREATE_BODY;
    const res = await request(getApp()).post("/api/animals").send(body);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/name is required/i);
  });

  it("returns 400 when description is missing", async () => {
    const { description, ...body } = VALID_CREATE_BODY;
    const res = await request(getApp()).post("/api/animals").send(body);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/description is required/i);
  });

  it("returns 400 when species is invalid", async () => {
    const res = await request(getApp())
      .post("/api/animals")
      .send({ ...VALID_CREATE_BODY, species: "hamster" });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/invalid species/i);
  });

  it("returns 400 when size is invalid", async () => {
    const res = await request(getApp())
      .post("/api/animals")
      .send({ ...VALID_CREATE_BODY, size: "tiny" });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/invalid size/i);
  });

  it("returns 400 when gender is invalid", async () => {
    const res = await request(getApp())
      .post("/api/animals")
      .send({ ...VALID_CREATE_BODY, gender: "other" });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/invalid gender/i);
  });

  it("returns 400 when status is invalid", async () => {
    const res = await request(getApp())
      .post("/api/animals")
      .send({ ...VALID_CREATE_BODY, status: "available" });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/invalid status/i);
  });

  it("returns 400 when image_url is provided", async () => {
    const res = await request(getApp())
      .post("/api/animals")
      .send({ ...VALID_CREATE_BODY, image_url: "https://example.com/photo.jpg" });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/image_url is read-only/i);
  });

  it("creates animal with image_object_key", async () => {
    const newAnimal = { aid: 3, ...VALID_CREATE_BODY, image_object_key: "animals/3/photo.jpg" };
    const chain = buildChainableMock({ data: newAnimal, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(getApp())
      .post("/api/animals")
      .send({ ...VALID_CREATE_BODY, image_object_key: "animals/3/photo.jpg" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("creates animal with tags array", async () => {
    const newAnimal = { aid: 3, ...VALID_CREATE_BODY, tags: ["vaccinated", "friendly"] };
    const chain = buildChainableMock({ data: newAnimal, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(getApp())
      .post("/api/animals")
      .send({ ...VALID_CREATE_BODY, tags: ["vaccinated", "friendly"] });

    expect(res.status).toBe(201);
    expect(res.body.data.tags).toEqual(["vaccinated", "friendly"]);
  });

  it("returns 500 when database returns an error", async () => {
    const chain = buildChainableMock({ data: null, error: { message: "DB connection failed" } });
    mockFrom.mockReturnValue(chain);

    const res = await request(getApp()).post("/api/animals").send(VALID_CREATE_BODY);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe("DELETE /api/animals/:aid", () => {
  it("deletes an animal and returns 200 with the deleted record", async () => {
    const chain = buildChainableMock({ data: MOCK_ANIMALS[0], error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(getApp()).delete("/api/animals/1");

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

    const res = await request(getApp()).delete("/api/animals/999");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 for an invalid animal ID", async () => {
    const res = await request(getApp()).delete("/api/animals/abc");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/invalid animal id/i);
  });

  it("returns 400 for a negative animal ID", async () => {
    const res = await request(getApp()).delete("/api/animals/-1");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 500 when database returns an error", async () => {
    const chain = buildChainableMock({ data: null, error: { message: "DB connection failed" } });
    mockFrom.mockReturnValue(chain);

    const res = await request(getApp()).delete("/api/animals/1");

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe("PATCH /api/animals/:aid", () => {
  it("updates an animal and returns 200 with the updated record", async () => {
    const updated = { ...MOCK_ANIMALS[0], name: "Buddy Updated" };
    const chain = buildChainableMock({ data: updated, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(getApp())
      .patch("/api/animals/1")
      .send({ name: "Buddy Updated" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Buddy Updated");
  });

  it("accepts partial update with a single field", async () => {
    const updated = { ...MOCK_ANIMALS[0], status: "adoptado" };
    const chain = buildChainableMock({ data: updated, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(getApp())
      .patch("/api/animals/1")
      .send({ status: "adoptado" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("returns 404 when animal is not found", async () => {
    const chain = buildChainableMock({
      data: null,
      error: { code: "PGRST116", message: "not found" },
    });
    mockFrom.mockReturnValue(chain);

    const res = await request(getApp())
      .patch("/api/animals/999")
      .send({ name: "Ghost Animal" });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 for an invalid animal ID", async () => {
    const res = await request(getApp())
      .patch("/api/animals/abc")
      .send({ name: "Test" });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/invalid animal id/i);
  });

  it("returns 400 when no valid update fields are provided", async () => {
    const res = await request(getApp()).patch("/api/animals/1").send({});

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/no valid fields/i);
  });

  it("returns 400 when image_url is provided", async () => {
    const res = await request(getApp())
      .patch("/api/animals/1")
      .send({ image_url: "https://example.com/photo.jpg" });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/image_url is read-only/i);
  });

  it("returns 400 when tags is not an array", async () => {
    const res = await request(getApp())
      .patch("/api/animals/1")
      .send({ tags: "vaccinated" });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/invalid tags format/i);
  });

  it("accepts tags array in an update", async () => {
    const updated = { ...MOCK_ANIMALS[0], tags: ["friendly", "vaccinated"] };
    const chain = buildChainableMock({ data: updated, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(getApp())
      .patch("/api/animals/1")
      .send({ tags: ["friendly", "vaccinated"] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("returns 500 when database returns an error", async () => {
    const chain = buildChainableMock({ data: null, error: { message: "DB connection failed" } });
    mockFrom.mockReturnValue(chain);

    const res = await request(getApp())
      .patch("/api/animals/1")
      .send({ name: "Updated" });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
