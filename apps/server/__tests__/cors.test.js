process.env.ALLOWED_ORIGINS = "https://example.com, https://app.example.com ";

const request = require("supertest");

jest.mock("../lib/supabase", () => ({
  getSupabaseClient: () => ({ from: jest.fn() }),
  verifyConnection: jest.fn().mockResolvedValue({ connected: true }),
}));

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
});

const app = require("../server");

describe("CORS", () => {
  it("allows requests from a whitelisted origin", async () => {
    const res = await request(app).get("/health").set("Origin", "https://example.com");
    expect(res.headers["access-control-allow-origin"]).toBe("https://example.com");
  });

  it("blocks requests from an unknown origin", async () => {
    const res = await request(app).get("/health").set("Origin", "https://evil.com");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("normalizes origins with surrounding whitespace in env var", async () => {
    const res = await request(app)
      .get("/health")
      .set("Origin", "https://app.example.com");
    expect(res.headers["access-control-allow-origin"]).toBe("https://app.example.com");
  });

  it("responds 204 to OPTIONS preflight from a whitelisted origin", async () => {
    const res = await request(app)
      .options("/api/animals")
      .set("Origin", "https://example.com")
      .set("Access-Control-Request-Method", "POST");
    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe("https://example.com");
    expect(res.headers["access-control-allow-methods"]).toMatch(/POST/i);
  });

  it("does not set CORS headers on OPTIONS from an unknown origin", async () => {
    const res = await request(app)
      .options("/api/animals")
      .set("Origin", "https://evil.com")
      .set("Access-Control-Request-Method", "POST");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
