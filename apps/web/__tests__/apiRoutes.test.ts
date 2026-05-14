/**
 * Tests for Next.js API proxy routes:
 *   pages/api/posts.ts
 *   pages/api/facebook-posts.ts
 *   pages/api/settings/pinned-fb-post.ts
 */

import type { NextApiRequest, NextApiResponse } from "next";

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockRes() {
  const res: Partial<NextApiResponse> & { _status: number; _body: unknown } = {
    _status: 200,
    _body: undefined,
  };
  res.status = function (code: number) {
    res._status = code;
    return res as NextApiResponse;
  };
  res.json = function (data: unknown) {
    res._body = data;
    return res as NextApiResponse;
  };
  res.setHeader = jest.fn() as unknown as NextApiResponse["setHeader"];
  return res;
}

function mockReq(overrides: Partial<NextApiRequest> = {}): NextApiRequest {
  return {
    method: "GET",
    query: {},
    headers: {},
    body: undefined,
    ...overrides,
  } as NextApiRequest;
}

// ─────────────────────────────────────────────────────────────────────────────
// pages/api/posts.ts
// ─────────────────────────────────────────────────────────────────────────────

describe("pages/api/posts", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:4000";
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns 405 for non-GET methods", async () => {
    const { default: handler } = await import("@/pages/api/posts");
    const req = mockReq({ method: "POST" });
    const res = mockRes();
    await handler(req, res as NextApiResponse);
    expect(res._status).toBe(405);
  });

  it("returns 500 when API_BASE_URL not configured", async () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    jest.resetModules();
    const { default: handler } = await import("@/pages/api/posts");
    const req = mockReq();
    const res = mockRes();
    await handler(req, res as NextApiResponse);
    expect(res._status).toBe(500);
  });

  it("proxies GET and returns upstream response", async () => {
    const mockData = { success: true, data: [{ pid: 1 }] };
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      json: async () => mockData,
    });
    const { default: handler } = await import("@/pages/api/posts");
    const req = mockReq({ query: { limit: "10", offset: "0" } });
    const res = mockRes();
    await handler(req, res as NextApiResponse);
    expect(res._status).toBe(200);
    expect(res._body).toEqual(mockData);
  });

  it("returns 502 when upstream fetch throws", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
    jest.spyOn(console, "error").mockImplementation(() => {});
    const { default: handler } = await import("@/pages/api/posts");
    const req = mockReq();
    const res = mockRes();
    await handler(req, res as NextApiResponse);
    expect(res._status).toBe(502);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// pages/api/facebook-posts.ts
// ─────────────────────────────────────────────────────────────────────────────

describe("pages/api/facebook-posts", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.FB_PAGE_ID = "12345";
    process.env.FB_ACCESS_TOKEN = "test-token";
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns 405 for non-GET methods", async () => {
    const { default: handler } = await import("@/pages/api/facebook-posts");
    const res = mockRes();
    await handler(mockReq({ method: "DELETE" }), res as NextApiResponse);
    expect(res._status).toBe(405);
  });

  it("returns 500 when FB credentials not configured", async () => {
    delete process.env.FB_PAGE_ID;
    delete process.env.FB_ACCESS_TOKEN;
    jest.resetModules();
    const { default: handler } = await import("@/pages/api/facebook-posts");
    const res = mockRes();
    await handler(mockReq(), res as NextApiResponse);
    expect(res._status).toBe(500);
  });

  it("returns 200 with Facebook posts on success", async () => {
    const mockPosts = [
      { id: "1", message: "Hello", created_time: "2026-01-01", permalink_url: "https://fb.com/1" },
    ];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: mockPosts }),
    });
    const { default: handler } = await import("@/pages/api/facebook-posts");
    const res = mockRes();
    await handler(mockReq(), res as NextApiResponse);
    expect(res._status).toBe(200);
    expect(res._body).toEqual(mockPosts);
  });

  it("returns error status when FB API returns error in body", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ error: { message: "FB error", type: "OAuthException", code: 190 } }),
    });
    const { default: handler } = await import("@/pages/api/facebook-posts");
    const res = mockRes();
    await handler(mockReq(), res as NextApiResponse);
    expect(res._status).toBe(502);
    expect((res._body as { error: string }).error).toBe("FB error");
  });

  it("returns 500 when fetch throws", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network failure"));
    const { default: handler } = await import("@/pages/api/facebook-posts");
    const res = mockRes();
    await handler(mockReq(), res as NextApiResponse);
    expect(res._status).toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// pages/api/settings/pinned-fb-post.ts
// ─────────────────────────────────────────────────────────────────────────────

describe("pages/api/settings/pinned-fb-post", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:4000";
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns 405 for non-GET methods", async () => {
    const { default: handler } = await import("@/pages/api/settings/pinned-fb-post");
    const res = mockRes();
    await handler(mockReq({ method: "POST" }), res as NextApiResponse);
    expect(res._status).toBe(405);
  });

  it("returns 500 when API_BASE_URL not configured", async () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    jest.resetModules();
    const { default: handler } = await import("@/pages/api/settings/pinned-fb-post");
    const res = mockRes();
    await handler(mockReq(), res as NextApiResponse);
    expect(res._status).toBe(500);
  });

  it("proxies GET and returns upstream response", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ pinnedFbPostId: "abc" }),
    });
    const { default: handler } = await import("@/pages/api/settings/pinned-fb-post");
    const res = mockRes();
    await handler(mockReq(), res as NextApiResponse);
    expect(res._status).toBe(200);
    expect(res._body).toEqual({ pinnedFbPostId: "abc" });
  });

  it("returns 502 with null when upstream throws", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Connection refused"));
    const { default: handler } = await import("@/pages/api/settings/pinned-fb-post");
    const res = mockRes();
    await handler(mockReq(), res as NextApiResponse);
    expect(res._status).toBe(502);
    expect((res._body as { pinnedFbPostId: null }).pinnedFbPostId).toBeNull();
  });
});
