const { buildImageStorageUpdate } = require("../scripts/migrateImageUrls");

describe("buildImageStorageUpdate", () => {
  it("backfills image_object_key from a signed URL", () => {
    const result = buildImageStorageUpdate({
      aid: 9,
      name: "Simba",
      image_url:
        "https://bucket.account.r2.cloudflarestorage.com/animals/9/123-photo.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256",
      image_object_key: null,
    });

    expect(result).toMatchObject({
      aid: 9,
      image_object_key: "animals/9/123-photo.jpg",
      image_url: "https://pub-test-bucket.r2.dev/animals/9/123-photo.jpg",
    });
  });

  it("backfills image_object_key from a public URL", () => {
    const result = buildImageStorageUpdate({
      aid: 10,
      name: "Daisy",
      image_url: "https://pub-test-bucket.r2.dev/animals/10/123-photo.jpg",
      image_object_key: null,
    });

    expect(result).toMatchObject({
      aid: 10,
      image_object_key: "animals/10/123-photo.jpg",
      image_url: "https://pub-test-bucket.r2.dev/animals/10/123-photo.jpg",
    });
  });

  it("preserves a plain object key", () => {
    const result = buildImageStorageUpdate({
      aid: 11,
      name: "Rocky",
      image_url: "animals/11/123-photo.jpg",
      image_object_key: null,
    });

    expect(result).toMatchObject({
      aid: 11,
      image_object_key: "animals/11/123-photo.jpg",
      image_url: "https://pub-test-bucket.r2.dev/animals/11/123-photo.jpg",
    });
  });

  it("returns null for rows without image data", () => {
    expect(
      buildImageStorageUpdate({
        aid: 12,
        name: "NoImage",
        image_url: null,
        image_object_key: null,
      })
    ).toBeNull();
  });
});
