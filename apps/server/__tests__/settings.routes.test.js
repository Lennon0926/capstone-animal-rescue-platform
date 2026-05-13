const request = require("supertest");

const mockGetSetting = jest.fn();
const mockSetSetting = jest.fn();
const mockAuthGetUser = jest.fn();

jest.mock("../repositories/settingsRepository", () => ({
  getSetting: (...args) => mockGetSetting(...args),
  setSetting: (...args) => mockSetSetting(...args),
}));

jest.mock("../lib/supabase", () => ({
  getSupabaseClient: () => ({
    auth: { getUser: mockAuthGetUser },
  }),
  verifyConnection: () => Promise.resolve({ connected: true }),
}));

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  process.env.PORT = "4000";
  process.env.SUPABASE_URL = "http://localhost";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
});

afterAll(() => {
  console.error.mockRestore();
});

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthGetUser.mockResolvedValue({
    data: { user: { id: "test-user-id" } },
    error: null,
  });
});

const getApp = () => {
  jest.resetModules();
  jest.mock("../repositories/settingsRepository", () => ({
    getSetting: (...args) => mockGetSetting(...args),
    setSetting: (...args) => mockSetSetting(...args),
  }));
  jest.mock("../lib/supabase", () => ({
    getSupabaseClient: () => ({
      auth: { getUser: mockAuthGetUser },
    }),
    verifyConnection: () => Promise.resolve({ connected: true }),
  }));
  return require("../server");
};

describe("GET /api/settings/pinned-fb-post", () => {
  it("returns pinnedFbPostId when setting exists", async () => {
    mockGetSetting.mockResolvedValue("12345");
    const res = await request(getApp()).get("/api/settings/pinned-fb-post");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ pinnedFbPostId: "12345" });
    expect(mockGetSetting).toHaveBeenCalledWith("pinned_fb_post_id");
  });

  it("returns null pinnedFbPostId when not set", async () => {
    mockGetSetting.mockResolvedValue(null);
    const res = await request(getApp()).get("/api/settings/pinned-fb-post");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ pinnedFbPostId: null });
  });

  it("returns 500 on repository error", async () => {
    mockGetSetting.mockRejectedValue(new Error("DB error"));
    const res = await request(getApp()).get("/api/settings/pinned-fb-post");
    expect(res.status).toBe(500);
  });
});

describe("PUT /api/settings/pinned-fb-post", () => {
  it("returns 401 without auth token", async () => {
    const res = await request(getApp())
      .put("/api/settings/pinned-fb-post")
      .set("Content-Type", "application/json")
      .send({ postId: "abc" });
    expect(res.status).toBe(401);
  });

  it("updates setting and returns success with authenticated user", async () => {
    mockSetSetting.mockResolvedValue("abc");
    const res = await request(getApp())
      .put("/api/settings/pinned-fb-post")
      .set("Authorization", "Bearer test-token")
      .set("Content-Type", "application/json")
      .send({ postId: "abc" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, pinnedFbPostId: "abc" });
    expect(mockSetSetting).toHaveBeenCalledWith("pinned_fb_post_id", "abc");
  });

  it("sets null when postId is omitted", async () => {
    mockSetSetting.mockResolvedValue(null);
    const res = await request(getApp())
      .put("/api/settings/pinned-fb-post")
      .set("Authorization", "Bearer test-token")
      .set("Content-Type", "application/json")
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.pinnedFbPostId).toBeNull();
    expect(mockSetSetting).toHaveBeenCalledWith("pinned_fb_post_id", null);
  });

  it("returns 500 on repository error", async () => {
    mockSetSetting.mockRejectedValue(new Error("DB error"));
    const res = await request(getApp())
      .put("/api/settings/pinned-fb-post")
      .set("Authorization", "Bearer test-token")
      .set("Content-Type", "application/json")
      .send({ postId: "x" });
    expect(res.status).toBe(500);
  });

  it("returns 401 when token is invalid", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: new Error("invalid") });
    const res = await request(getApp())
      .put("/api/settings/pinned-fb-post")
      .set("Authorization", "Bearer bad-token")
      .set("Content-Type", "application/json")
      .send({ postId: "x" });
    expect(res.status).toBe(401);
  });
});
