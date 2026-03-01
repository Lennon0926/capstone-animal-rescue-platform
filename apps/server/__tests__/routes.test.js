const request = require("supertest");

beforeAll(() => {
  process.env.PORT = "4000";
});

const getApp = () => require("../server");

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
    expect(res.body.data.allowedMimeTypes).toEqual(
      expect.arrayContaining(["image/jpeg", "image/png", "image/webp"])
    );
  });
});

describe("POST /api/uploads/animals/:animalId/image", () => {
  it("rejects requests with invalid animalId", async () => {
    const res = await request(getApp())
      .post("/api/uploads/animals/!!invalid!!/image")
      .attach("image", Buffer.from("fake"), {
        filename: "test.jpg",
        contentType: "image/jpeg",
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_ANIMAL_ID");
  });

  it("rejects requests with no file attached", async () => {
    const res = await request(getApp())
      .post("/api/uploads/animals/test-animal-1/image");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("MISSING_IMAGE_FILE");
  });

  it("rejects files with unsupported MIME type", async () => {
    const res = await request(getApp())
      .post("/api/uploads/animals/test-animal-1/image")
      .attach("image", Buffer.from("fake"), {
        filename: "test.gif",
        contentType: "image/gif",
      });
    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe("INVALID_IMAGE_TYPE");
  });
});
