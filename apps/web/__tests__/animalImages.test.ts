describe("getAnimalImageUrl", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL = "https://pub-test-bucket.r2.dev";
  });

  it("prefers image_object_key when present", async () => {
    const { getAnimalImageUrl } = await import("@/utils/animalImages");

    expect(
      getAnimalImageUrl(
        "https://images.unsplash.com/photo-123",
        "dog",
        1,
        "animals/1/test image.jpg",
      ),
    ).toBe("https://pub-test-bucket.r2.dev/animals/1/test%20image.jpg");
  });

  it("returns external absolute URLs unchanged", async () => {
    const { getAnimalImageUrl } = await import("@/utils/animalImages");

    expect(getAnimalImageUrl("https://images.unsplash.com/photo-123", "dog", 1)).toBe(
      "https://images.unsplash.com/photo-123",
    );
  });

  it("falls back to a placeholder for non-absolute image_url values", async () => {
    const { getAnimalImageUrl, getPlaceholderImage } = await import(
      "@/utils/animalImages"
    );

    expect(getAnimalImageUrl("animals/1/test.jpg", "dog", 1)).toBe(
      getPlaceholderImage("dog", 1),
    );
  });
});
