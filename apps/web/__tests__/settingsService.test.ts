/**
 * Tests for services/settingsService.ts
 */

jest.mock("@/lib/apiAuth", () => ({
  getAuthenticatedHeaders: jest.fn(async (extra = {}) => ({
    Authorization: "Bearer test-token",
    ...extra,
  })),
}));

const originalEnv = process.env;

let fetchPinnedFbPostId: typeof import("@/services/settingsService").fetchPinnedFbPostId;
let setPinnedFbPostId: typeof import("@/services/settingsService").setPinnedFbPostId;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  process.env = { ...originalEnv, NEXT_PUBLIC_API_BASE_URL: "http://localhost:4000" };

  jest.mock("@/lib/apiAuth", () => ({
    getAuthenticatedHeaders: jest.fn(async (extra = {}) => ({
      Authorization: "Bearer test-token",
      ...extra,
    })),
  }));

  ({ fetchPinnedFbPostId, setPinnedFbPostId } = require("@/services/settingsService"));
});

afterAll(() => {
  process.env = originalEnv;
});

// ── fetchPinnedFbPostId ───────────────────────────────────────────────────────

describe("fetchPinnedFbPostId", () => {
  it("returns the pinnedFbPostId on success", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ pinnedFbPostId: "abc123" }),
    });
    const result = await fetchPinnedFbPostId();
    expect(result).toBe("abc123");
    expect(global.fetch).toHaveBeenCalledWith("/api/settings/pinned-fb-post");
  });

  it("returns null when response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
    const result = await fetchPinnedFbPostId();
    expect(result).toBeNull();
  });

  it("returns null when pinnedFbPostId is absent from response", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    const result = await fetchPinnedFbPostId();
    expect(result).toBeNull();
  });
});

// ── setPinnedFbPostId ─────────────────────────────────────────────────────────

describe("setPinnedFbPostId", () => {
  it("PUTs to the correct URL with the postId", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    await setPinnedFbPostId("post-99");
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/settings/pinned-fb-post",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ postId: "post-99" }),
      })
    );
  });

  it("sends null postId to unpin", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    await setPinnedFbPostId(null);
    const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(callBody.postId).toBeNull();
  });

  it("throws when response is not ok with string error", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Unauthorized" }),
    });
    await expect(setPinnedFbPostId("x")).rejects.toThrow("Unauthorized");
  });

  it("throws when response is not ok with object error", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: "Token expired" } }),
    });
    await expect(setPinnedFbPostId("x")).rejects.toThrow("Token expired");
  });

  it("throws with fallback message when error shape unknown", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });
    await expect(setPinnedFbPostId("x")).rejects.toThrow(/Failed to update/i);
  });

  it("throws when NEXT_PUBLIC_API_BASE_URL is not set", async () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    jest.resetModules();
    jest.mock("@/lib/apiAuth", () => ({
      getAuthenticatedHeaders: jest.fn(async () => ({})),
    }));
    const { setPinnedFbPostId: setPinnedFbPostIdFresh } = require("@/services/settingsService");
    await expect(setPinnedFbPostIdFresh("x")).rejects.toThrow(/NEXT_PUBLIC_API_BASE_URL/);
  });
});
