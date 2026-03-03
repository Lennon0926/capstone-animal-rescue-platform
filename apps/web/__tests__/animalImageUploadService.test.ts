const MOCK_API_BASE = "http://localhost:4000";

let uploadAnimalImage: typeof import("@/services/animalImageUploadService").uploadAnimalImage;

beforeEach(() => {
  jest.resetModules();
  process.env.NEXT_PUBLIC_API_BASE_URL = MOCK_API_BASE;
  uploadAnimalImage =
    require("@/services/animalImageUploadService").uploadAnimalImage;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("uploadAnimalImage", () => {
  it("throws when animalId is empty", async () => {
    const file = new File(["img"], "photo.jpg", { type: "image/jpeg" });
    await expect(uploadAnimalImage("  ", file)).rejects.toThrow(
      "Animal ID is required"
    );
  });

  it("calls the correct endpoint with a FormData body", async () => {
    const mockResult = {
      objectKey: "animals/abc/1-photo.jpg",
      url: "https://cdn.example.com/animals/abc/1-photo.jpg",
      urlType: "public" as const,
      contentType: "image/jpeg",
      size: 1024,
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockResult }),
    });

    const file = new File(["img"], "photo.jpg", { type: "image/jpeg" });
    const result = await uploadAnimalImage("abc", file);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(`${MOCK_API_BASE}/api/uploads/animals/abc/image`);
    expect(options.method).toBe("POST");
    expect(options.body).toBeInstanceOf(FormData);
    expect(result).toEqual(mockResult);
  });

  it("throws on non-ok response with server error message", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () =>
        Promise.resolve({
          error: { code: "INVALID_IMAGE_TYPE", message: "Unsupported type" },
        }),
    });

    const file = new File(["img"], "photo.gif", { type: "image/gif" });
    await expect(uploadAnimalImage("abc", file)).rejects.toThrow(
      "Unsupported type"
    );
  });

  it("throws a generic message when response body is empty", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error("no json")),
    });

    const file = new File(["img"], "photo.jpg", { type: "image/jpeg" });
    await expect(uploadAnimalImage("abc", file)).rejects.toThrow(
      "Image upload failed"
    );
  });

  it("throws when server returns ok but no data payload", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const file = new File(["img"], "photo.jpg", { type: "image/jpeg" });
    await expect(uploadAnimalImage("abc", file)).rejects.toThrow(
      "response payload was invalid"
    );
  });

  it("encodes special characters in animalId", async () => {
    const mockResult = {
      objectKey: "animals/a%20b/1-photo.jpg",
      url: "https://cdn.example.com/animals/a%20b/1-photo.jpg",
      urlType: "public" as const,
      contentType: "image/jpeg",
      size: 512,
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockResult }),
    });

    const file = new File(["img"], "photo.jpg", { type: "image/jpeg" });
    await uploadAnimalImage("a b", file);

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(`${MOCK_API_BASE}/api/uploads/animals/a%20b/image`);
  });
});
