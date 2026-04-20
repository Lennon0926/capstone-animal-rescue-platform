const request = require("supertest");

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  process.env.PORT = "4000";
});

afterAll(() => {
  console.error.mockRestore();
});

const getApp = () => require("../server");

describe("requireJson middleware", () => {
  describe("POST /api/animals", () => {
    it("returns 415 when Content-Type is missing", async () => {
      const res = await request(getApp())
        .post("/api/animals")
        .send("name=Rex");
      expect(res.status).toBe(415);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe(415);
      expect(res.body.error.message).toMatch(/application\/json/i);
    });

    it("returns 415 when Content-Type is text/plain", async () => {
      const res = await request(getApp())
        .post("/api/animals")
        .set("Content-Type", "text/plain")
        .send("name=Rex");
      expect(res.status).toBe(415);
      expect(res.body.success).toBe(false);
    });

    it("proceeds past requireJson when Content-Type is application/json", async () => {
      const res = await request(getApp())
        .post("/api/animals")
        .set("Content-Type", "application/json")
        .send({});
      expect(res.status).not.toBe(415);
    });

    it("proceeds past requireJson when Content-Type is application/json with charset", async () => {
      const res = await request(getApp())
        .post("/api/animals")
        .set("Content-Type", "application/json; charset=utf-8")
        .send({});
      expect(res.status).not.toBe(415);
    });
  });

  describe("PATCH /api/animals/:aid", () => {
    it("returns 415 when Content-Type is missing", async () => {
      const res = await request(getApp())
        .patch("/api/animals/1")
        .send("name=Rex");
      expect(res.status).toBe(415);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe(415);
    });

    it("proceeds past requireJson when Content-Type is application/json", async () => {
      const res = await request(getApp())
        .patch("/api/animals/1")
        .set("Content-Type", "application/json")
        .send({});
      expect(res.status).not.toBe(415);
    });
  });

  describe("POST /api/uploads (multipart — no requireJson)", () => {
    it("does not return 415 for multipart uploads", async () => {
      const res = await request(getApp())
        .post("/api/uploads/animals/test-animal-1/image")
        .attach("image", Buffer.from("fake"), {
          filename: "test.jpg",
          contentType: "image/jpeg",
        });
      expect(res.status).not.toBe(415);
    });
  });
});
