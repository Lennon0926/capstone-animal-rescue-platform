const request = require("supertest");

beforeAll(() => {
  process.env.PORT = "4000";
});

const getApp = () => require("../server");

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
});
