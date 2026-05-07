/**
 * postService unit tests
 * Covers: fetchPosts, fetchPost, createPost, updatePost, deletePost, uploadPostImage
 */

const MOCK_API_BASE = "http://localhost:4000";

const MOCK_POST = {
  pid: 1,
  header: "Test Header",
  body: "Test body.",
  is_pinned: false,
  image_url: null,
  image_object_key: null,
  created_at: "2026-01-01T00:00:00Z",
};

// Mock imageCompressor so it's a passthrough (no canvas in jsdom)
jest.mock("@/lib/imageCompressor", () => ({
  compressIfNeeded: async (file: File) => file,
}));

// Mock apiAuth so getAuthenticatedHeaders returns predictable headers
jest.mock("@/lib/apiAuth", () => ({
  getAuthenticatedHeaders: async (extra = {}) => ({
    Authorization: "Bearer test-token",
    ...extra,
  }),
}));

let fetchPosts: typeof import("@/services/postService").fetchPosts;
let fetchPost: typeof import("@/services/postService").fetchPost;
let createPost: typeof import("@/services/postService").createPost;
let updatePost: typeof import("@/services/postService").updatePost;
let deletePost: typeof import("@/services/postService").deletePost;
let uploadPostImage: typeof import("@/services/postService").uploadPostImage;

beforeEach(() => {
  jest.resetModules();
  process.env.NEXT_PUBLIC_API_BASE_URL = MOCK_API_BASE;
  ({
    fetchPosts,
    fetchPost,
    createPost,
    updatePost,
    deletePost,
    uploadPostImage,
  } = require("@/services/postService"));
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ── fetchPosts ────────────────────────────────────────────────────────────────

describe("fetchPosts", () => {
  it("calls correct URL and returns posts array", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [MOCK_POST] }),
    });

    const result = await fetchPosts();

    expect(global.fetch).toHaveBeenCalledWith(`${MOCK_API_BASE}/api/posts?limit=100`);
    expect(result).toEqual([MOCK_POST]);
  });

  it("throws on non-ok response", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ success: false }),
    });

    await expect(fetchPosts()).rejects.toThrow("Failed to fetch posts.");
  });

  it("throws when NEXT_PUBLIC_API_BASE_URL is undefined", async () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    jest.resetModules();
    fetchPosts = require("@/services/postService").fetchPosts;
    await expect(fetchPosts()).rejects.toThrow("NEXT_PUBLIC_API_BASE_URL");
  });
});

// ── fetchPost ─────────────────────────────────────────────────────────────────

describe("fetchPost", () => {
  it("calls /api/posts/:pid and returns post", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: MOCK_POST }),
    });

    const result = await fetchPost(1);

    expect(global.fetch).toHaveBeenCalledWith(`${MOCK_API_BASE}/api/posts/1`);
    expect(result.pid).toBe(1);
  });

  it("throws on non-ok response", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ success: false }),
    });

    await expect(fetchPost(999)).rejects.toThrow("Failed to fetch post.");
  });
});

// ── createPost ────────────────────────────────────────────────────────────────

describe("createPost", () => {
  it("sends POST with auth headers and correct body", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: MOCK_POST }),
    });

    const result = await createPost({ header: "Hello", body: "World" });

    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(`${MOCK_API_BASE}/api/posts`);
    expect(options.method).toBe("POST");
    expect(options.headers).toMatchObject({ Authorization: "Bearer test-token", "Content-Type": "application/json" });
    expect(JSON.parse(options.body)).toMatchObject({ header: "Hello", body: "World" });
    expect(result.pid).toBe(1);
  });

  it("throws with server error message on failure", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ success: false, error: "Validation failed" }),
    });

    await expect(createPost({ header: "X", body: "Y" })).rejects.toThrow("Validation failed");
  });

  it("throws with message from structured error object", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ success: false, error: { message: "header too long" } }),
    });

    await expect(createPost({ header: "X", body: "Y" })).rejects.toThrow("header too long");
  });
});

// ── updatePost ────────────────────────────────────────────────────────────────

describe("updatePost", () => {
  it("sends PATCH to /api/posts/:pid with auth headers", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { ...MOCK_POST, header: "Updated" } }),
    });

    const result = await updatePost(1, { header: "Updated" });

    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(`${MOCK_API_BASE}/api/posts/1`);
    expect(options.method).toBe("PATCH");
    expect(options.headers).toMatchObject({ Authorization: "Bearer test-token" });
    expect(result.header).toBe("Updated");
  });

  it("sends remove_image flag when provided", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { ...MOCK_POST, image_url: null } }),
    });

    await updatePost(1, { remove_image: true });

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(options.body)).toMatchObject({ remove_image: true });
  });

  it("throws on server error", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ success: false, error: "Post not found" }),
    });

    await expect(updatePost(999, { header: "X" })).rejects.toThrow("Post not found");
  });
});

// ── deletePost ────────────────────────────────────────────────────────────────

describe("deletePost", () => {
  it("sends DELETE to /api/posts/:pid with auth headers", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: MOCK_POST }),
    });

    const result = await deletePost(1);

    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(`${MOCK_API_BASE}/api/posts/1`);
    expect(options.method).toBe("DELETE");
    expect(options.headers).toMatchObject({ Authorization: "Bearer test-token" });
    expect(result.pid).toBe(1);
  });

  it("throws on failed delete", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ success: false, error: "Not found" }),
    });

    await expect(deletePost(999)).rejects.toThrow("Not found");
  });
});

// ── uploadPostImage ───────────────────────────────────────────────────────────

describe("uploadPostImage", () => {
  it("sends POST to correct upload endpoint with FormData", async () => {
    const mockResult = {
      objectKey: "posts/1/1-photo.jpg",
      url: "https://cdn.example.com/posts/1/1-photo.jpg",
      urlType: "public" as const,
      contentType: "image/jpeg",
      size: 2048,
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockResult }),
    });

    const file = new File(["img"], "photo.jpg", { type: "image/jpeg" });
    const result = await uploadPostImage(1, file);

    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(`${MOCK_API_BASE}/api/uploads/posts/1/image`);
    expect(options.method).toBe("POST");
    expect(options.body).toBeInstanceOf(FormData);
    expect(result).toEqual(mockResult);
  });

  it("throws when upload returns no data", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: { message: "File too large" } }),
    });

    const file = new File(["img"], "photo.jpg", { type: "image/jpeg" });
    await expect(uploadPostImage(1, file)).rejects.toThrow("File too large");
  });
});
