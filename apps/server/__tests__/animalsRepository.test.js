const {
  normalizeAnimalImageFields,
  serializeAnimalRecord,
} = require("../repositories/animalsRepository");

describe("animal image storage normalization", () => {
  it("derives a public image_url from image_object_key", () => {
    const normalized = normalizeAnimalImageFields({
      image_object_key: "animals/7/123-photo.jpg",
    });

    expect(normalized).toMatchObject({
      image_object_key: "animals/7/123-photo.jpg",
      image_url: "https://pub-test-bucket.r2.dev/animals/7/123-photo.jpg",
    });
  });

  it("does not recover legacy R2 URLs during normal repository writes", () => {
    const normalized = normalizeAnimalImageFields({
      image_url:
        "https://bucket.account.r2.cloudflarestorage.com/animals/9/123-photo.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256",
    });

    expect(normalized).toEqual({});
  });

  it("preserves external image URLs that are not backed by R2", () => {
    const normalized = normalizeAnimalImageFields({
      image_url: "https://images.unsplash.com/photo-123",
    });

    expect(normalized).toEqual({
      image_url: "https://images.unsplash.com/photo-123",
    });
  });
});

describe("serializeAnimalRecord", () => {
  it("prefers the object key as the source of truth in API responses", () => {
    const serialized = serializeAnimalRecord({
      aid: 5,
      name: "Buddy",
      image_object_key: "animals/5/123-photo.jpg",
      image_url:
        "https://bucket.account.r2.cloudflarestorage.com/animals/5/expired.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256",
    });

    expect(serialized).toMatchObject({
      aid: 5,
      image_object_key: "animals/5/123-photo.jpg",
      image_url: "https://pub-test-bucket.r2.dev/animals/5/123-photo.jpg",
    });
  });

  it("drops legacy R2 URLs from read responses when no object key exists", () => {
    const serialized = serializeAnimalRecord({
      aid: 6,
      name: "Luna",
      image_object_key: null,
      image_url:
        "https://bucket.account.r2.cloudflarestorage.com/animals/6/expired.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256",
    });

    expect(serialized).toMatchObject({
      aid: 6,
      image_object_key: null,
      image_url: null,
    });
  });
});
