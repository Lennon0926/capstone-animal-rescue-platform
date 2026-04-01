const MOCK_API_BASE = "http://localhost:4000";

let uploadAnimalImage: typeof import("@/services/animalImageUploadService").uploadAnimalImage;

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
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

describe("fetchAnimals", () => {
  let fetchAnimals: typeof import("@/services/animalImageUploadService").fetchAnimals;

  beforeEach(() => {
    fetchAnimals = require("@/services/animalImageUploadService").fetchAnimals;
  });

  it("fetches animals from the API", async () => {
    const mockAnimals = [
      { aid: 1, name: "Max", species: "dog" },
      { aid: 2, name: "Luna", species: "cat" },
    ];

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockAnimals }),
    });

    const result = await fetchAnimals();

    expect(global.fetch).toHaveBeenCalledWith(
      `${MOCK_API_BASE}/api/animals?limit=100`
    );
    expect(result).toEqual(mockAnimals);
  });

  it("throws on failed response", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ success: false }),
    });

    await expect(fetchAnimals()).rejects.toThrow("Failed to fetch animals");
  });
});

describe("updateAnimalImageObjectKey", () => {
  let updateAnimalImageObjectKey: typeof import("@/services/animalImageUploadService").updateAnimalImageObjectKey;

  beforeEach(() => {
    updateAnimalImageObjectKey =
      require("@/services/animalImageUploadService").updateAnimalImageObjectKey;
  });

  it("sends PATCH request with image_object_key", async () => {
    const mockAnimal = {
      aid: 1,
      name: "Max",
      image_url: "https://cdn.example.com/animals/1/1-photo.jpg",
      image_object_key: "animals/1/1-photo.jpg",
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockAnimal }),
    });

    const result = await updateAnimalImageObjectKey(
      1,
      "animals/1/1-photo.jpg"
    );

    expect(global.fetch).toHaveBeenCalledWith(
      `${MOCK_API_BASE}/api/animals/1`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_object_key: "animals/1/1-photo.jpg" }),
      }
    );
    expect(result).toEqual(mockAnimal);
  });

  it("throws on failed update", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: "Animal not found" }),
    });

    await expect(
      updateAnimalImageObjectKey(999, "animals/999/missing.jpg")
    ).rejects.toThrow("Animal not found");

    const errorLogs = (console.error as jest.Mock).mock.calls.map(([entry]) =>
      String(entry)
    );
    expect(
      errorLogs.some(
        (entry) =>
          entry.includes('"event":"animal_image_update_failed"') &&
          entry.includes('"animalId":999') &&
          entry.includes('"errorMessage":"Animal not found"')
      )
    ).toBe(true);
  });

  it("uses the server message from structured error objects", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({
          error: {
            code: 400,
            message: "Invalid image_object_key.",
            details: { traceId: "trace-123" },
          },
        }),
    });

    await expect(
      updateAnimalImageObjectKey(1, "animals/1/bad key.jpg")
    ).rejects.toMatchObject({
      name: "UploadApiError",
      message: "Invalid image_object_key.",
      code: "400",
    });

    const errorLogs = (console.error as jest.Mock).mock.calls.map(([entry]) =>
      String(entry)
    );
    expect(
      errorLogs.some(
        (entry) =>
          entry.includes('"event":"animal_image_update_failed"') &&
          entry.includes('"errorCode":"400"') &&
          entry.includes('"errorMessage":"Invalid image_object_key."')
      )
    ).toBe(true);
  });
});

describe("uploadAndUpdateAnimalImage", () => {
  let uploadAndUpdateAnimalImage: typeof import("@/services/animalImageUploadService").uploadAndUpdateAnimalImage;

  beforeEach(() => {
    uploadAndUpdateAnimalImage = require("@/services/animalImageUploadService").uploadAndUpdateAnimalImage;
  });

  it("uploads image and updates animal record", async () => {
    const mockUploadResult = {
      objectKey: "animals/1/1-photo.jpg",
      url: "https://cdn.example.com/animals/1/1-photo.jpg",
      urlType: "public" as const,
      contentType: "image/jpeg",
      size: 1024,
    };

    const mockAnimal = {
      aid: 1,
      name: "Max",
      image_url: "https://cdn.example.com/animals/1/1-photo.jpg",
      image_object_key: "animals/1/1-photo.jpg",
    };

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockUploadResult }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockAnimal }),
      });

    const file = new File(["img"], "photo.jpg", { type: "image/jpeg" });
    const result = await uploadAndUpdateAnimalImage(1, file);

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result.uploadResult).toEqual(mockUploadResult);
    expect(result.animal).toEqual(mockAnimal);
  });
});
