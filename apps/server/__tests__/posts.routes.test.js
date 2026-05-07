/**
 * Posts routes integration tests
 * Covers: GET /api/posts, GET /api/posts/:pid, POST /api/posts,
 *         PATCH /api/posts/:pid, DELETE /api/posts/:pid
 */

const request = require("supertest");

// ── Supabase mock ────────────────────────────────────────────────────────────

const mockAuthGetUser = jest.fn();
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockUpsert = jest.fn();
const mockEq = jest.fn();
const mockNeq = jest.fn();
const mockOrder = jest.fn();
const mockRange = jest.fn();
const mockSingle = jest.fn();

function buildChain(terminal) {
  const chain = {
    select: (...a) => { mockSelect(...a); return chain; },
    insert: (...a) => { mockInsert(...a); return chain; },
    update: (...a) => { mockUpdate(...a); return chain; },
    delete: (...a) => { mockDelete(...a); return chain; },
    upsert: (...a) => { mockUpsert(...a); return chain; },
    eq:     (...a) => { mockEq(...a);     return chain; },
    neq:    (...a) => { mockNeq(...a);    return chain; },
    order:  (...a) => { mockOrder(...a);  return chain; },
    range:  (...a) => { mockRange(...a);  return chain; },
    single: (...a) => { mockSingle(...a); return terminal(); },
    // For list queries that don't call .single()
    then:   (resolve) => resolve(terminal()),
  };
  return chain;
}

const mockFrom = jest.fn();

jest.mock("../lib/supabase", () => ({
  getSupabaseClient: () => ({
    auth: { getUser: mockAuthGetUser },
    from: (...args) => mockFrom(...args),
  }),
  verifyConnection: jest.fn().mockResolvedValue({ connected: true }),
}));

jest.mock("../services/r2Service", () => ({
  isR2Configured: false,
  isPublicObjectUrlConfigured: true,
  missingR2EnvVars: [],
  missingPublicObjectUrlEnvVars: [],
  maxImageSizeBytes: 10 * 1024 * 1024,
  ALLOWED_MIME_TYPES: new Set(["image/jpeg", "image/png", "image/webp"]),
  normalizeObjectKey: (k) => (typeof k === "string" && k.trim() ? k.trim() : null),
  getPublicObjectUrl: (k) => (k ? `https://cdn.example.com/${k}` : null),
  checkR2Health: jest.fn().mockResolvedValue({ ok: false, code: "R2_NOT_CONFIGURED" }),
  deleteObject: jest.fn().mockResolvedValue(undefined),
  uploadPostImage: jest.fn(),
  uploadAnimalImage: jest.fn(),
  isR2DependencyError: () => false,
  extractObjectKeyFromImageReference: (v) => v,
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const getApp = () => require("../server");

const asAuthenticated = (req) => req.set("Authorization", "Bearer test-token");

const MOCK_POST = {
  pid: 1,
  header: "Test Header",
  body: "Test body text.",
  is_pinned: false,
  image_url: null,
  image_object_key: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  process.env.PORT = "4000";
});

afterAll(() => {
  console.error.mockRestore?.();
  console.warn.mockRestore?.();
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();

  mockAuthGetUser.mockResolvedValue({
    data: { user: { id: "test-user-id" } },
    error: null,
  });

  // Default: from() returns a chainable that resolves to list result
  mockFrom.mockImplementation(() =>
    buildChain(() => ({ data: [MOCK_POST], error: null, count: 1 }))
  );
});

// ── GET /api/posts ────────────────────────────────────────────────────────────

describe("GET /api/posts", () => {
  it("returns 200 with post list and pagination", async () => {
    mockFrom.mockImplementation(() =>
      buildChain(() => ({ data: [MOCK_POST], error: null, count: 1 }))
    );
    const res = await request(getApp()).get("/api/posts");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toMatchObject({ total: 1, limit: 50, offset: 0 });
  });

  it("returns empty list when no posts exist", async () => {
    mockFrom.mockImplementation(() =>
      buildChain(() => ({ data: [], error: null, count: 0 }))
    );
    const res = await request(getApp()).get("/api/posts");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.pagination.total).toBe(0);
  });

  it("accepts limit and offset query params", async () => {
    mockFrom.mockImplementation(() =>
      buildChain(() => ({ data: [], error: null, count: 0 }))
    );
    const res = await request(getApp()).get("/api/posts?limit=10&offset=5");
    expect(res.status).toBe(200);
    expect(res.body.pagination.limit).toBe(10);
    expect(res.body.pagination.offset).toBe(5);
  });

  it("falls back to default limit when limit param is non-numeric", async () => {
    mockFrom.mockImplementation(() =>
      buildChain(() => ({ data: [], error: null, count: 0 }))
    );
    const res = await request(getApp()).get("/api/posts?limit=abc");
    expect(res.status).toBe(200);
    expect(res.body.pagination.limit).toBe(50); // default
  });

  it("returns 500 on database error", async () => {
    mockFrom.mockImplementation(() =>
      buildChain(() => ({ data: null, error: { message: "DB error" }, count: 0 }))
    );
    const res = await request(getApp()).get("/api/posts");
    expect(res.status).toBe(500);
  });
});

// ── GET /api/posts/:pid ───────────────────────────────────────────────────────

describe("GET /api/posts/:pid", () => {
  it("returns 200 with post data", async () => {
    mockFrom.mockImplementation(() =>
      buildChain(() => ({ data: MOCK_POST, error: null }))
    );
    const res = await request(getApp()).get("/api/posts/1");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pid).toBe(1);
  });

  it("returns 404 for unknown post", async () => {
    mockFrom.mockImplementation(() =>
      buildChain(() => ({ data: null, error: { code: "PGRST116", message: "not found" } }))
    );
    const res = await request(getApp()).get("/api/posts/9999");
    expect(res.status).toBe(404);
  });

  it("rejects non-numeric pid", async () => {
    const res = await request(getApp()).get("/api/posts/abc");
    expect(res.status).toBe(400);
  });
});

// ── POST /api/posts ───────────────────────────────────────────────────────────

describe("POST /api/posts", () => {
  it("returns 401 without authentication", async () => {
    const res = await request(getApp())
      .post("/api/posts")
      .set("Content-Type", "application/json")
      .send({ header: "Hello", body: "World" });
    expect(res.status).toBe(401);
  });

  it("returns 400 without Content-Type: application/json", async () => {
    const res = await asAuthenticated(request(getApp()).post("/api/posts"))
      .send("header=Hello");
    expect(res.status).toBe(415);
  });

  it("returns 400 when header is missing", async () => {
    const res = await asAuthenticated(
      request(getApp()).post("/api/posts").set("Content-Type", "application/json")
    ).send({ body: "No header here" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when body is missing", async () => {
    const res = await asAuthenticated(
      request(getApp()).post("/api/posts").set("Content-Type", "application/json")
    ).send({ header: "No body here" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when is_pinned is not a boolean", async () => {
    const res = await asAuthenticated(
      request(getApp()).post("/api/posts").set("Content-Type", "application/json")
    ).send({ header: "Hi", body: "There", is_pinned: "false" });
    expect(res.status).toBe(400);
  });

  it("returns 201 with created post on valid payload", async () => {
    mockFrom.mockImplementation(() =>
      buildChain(() => ({ data: { ...MOCK_POST, header: "New Post" }, error: null }))
    );
    const res = await asAuthenticated(
      request(getApp()).post("/api/posts").set("Content-Type", "application/json")
    ).send({ header: "New Post", body: "Content here." });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.header).toBe("New Post");
  });
});

// ── PATCH /api/posts/:pid ─────────────────────────────────────────────────────

describe("PATCH /api/posts/:pid", () => {
  it("returns 401 without authentication", async () => {
    const res = await request(getApp())
      .patch("/api/posts/1")
      .set("Content-Type", "application/json")
      .send({ header: "Updated" });
    expect(res.status).toBe(401);
  });

  it("returns 400 when is_pinned is a string", async () => {
    const res = await asAuthenticated(
      request(getApp()).patch("/api/posts/1").set("Content-Type", "application/json")
    ).send({ is_pinned: "true" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when no valid fields provided", async () => {
    const res = await asAuthenticated(
      request(getApp()).patch("/api/posts/1").set("Content-Type", "application/json")
    ).send({});
    expect(res.status).toBe(400);
  });

  it("returns 200 with updated post", async () => {
    mockFrom.mockImplementation(() =>
      buildChain(() => ({ data: { ...MOCK_POST, header: "Updated" }, error: null }))
    );
    const res = await asAuthenticated(
      request(getApp()).patch("/api/posts/1").set("Content-Type", "application/json")
    ).send({ header: "Updated" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.header).toBe("Updated");
  });

  it("returns 404 for unknown post", async () => {
    mockFrom.mockImplementation(() =>
      buildChain(() => ({ data: null, error: { code: "PGRST116" } }))
    );
    const res = await asAuthenticated(
      request(getApp()).patch("/api/posts/9999").set("Content-Type", "application/json")
    ).send({ header: "X" });
    expect(res.status).toBe(404);
  });

  it("passes remove_image flag through to response", async () => {
    mockFrom.mockImplementation(() =>
      buildChain(() => ({ data: { ...MOCK_POST, image_url: null, image_object_key: null }, error: null }))
    );
    const res = await asAuthenticated(
      request(getApp()).patch("/api/posts/1").set("Content-Type", "application/json")
    ).send({ remove_image: true });
    expect(res.status).toBe(200);
    expect(res.body.data.image_url).toBeNull();
  });
});

// ── DELETE /api/posts/:pid ────────────────────────────────────────────────────

describe("DELETE /api/posts/:pid", () => {
  it("returns 401 without authentication", async () => {
    const res = await request(getApp()).delete("/api/posts/1");
    expect(res.status).toBe(401);
  });

  it("returns 200 with deleted post data", async () => {
    mockFrom.mockImplementation(() =>
      buildChain(() => ({ data: MOCK_POST, error: null }))
    );
    const res = await asAuthenticated(request(getApp()).delete("/api/posts/1"));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pid).toBe(1);
  });

  it("returns 404 for unknown post", async () => {
    mockFrom.mockImplementation(() =>
      buildChain(() => ({ data: null, error: { code: "PGRST116" } }))
    );
    const res = await asAuthenticated(request(getApp()).delete("/api/posts/9999"));
    expect(res.status).toBe(404);
  });

  it("rejects non-numeric pid", async () => {
    const res = await asAuthenticated(request(getApp()).delete("/api/posts/not-a-number"));
    expect(res.status).toBe(400);
  });
});
