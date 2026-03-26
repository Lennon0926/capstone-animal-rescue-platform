const {
  sanitizeString,
  validatePagination,
  validateSort,
  validateAnimalFilters,
} = require("../middleware/validation");

describe("sanitizeString", () => {
  it("strips SQL-injection characters", () => {
    expect(sanitizeString("hello; DROP TABLE--")).toBe("hello DROP TABLE--");
    expect(sanitizeString("it's a 'test'")).toBe("its a test");
  });

  it("trims and caps length at 100 characters", () => {
    const longInput = "a".repeat(200);
    expect(sanitizeString(longInput)).toHaveLength(100);
    expect(sanitizeString("  padded  ")).toBe("padded");
  });

  it("returns empty string for non-string input", () => {
    expect(sanitizeString(42)).toBe("");
    expect(sanitizeString(null)).toBe("");
    expect(sanitizeString(undefined)).toBe("");
  });
});

describe("validatePagination", () => {
  it("returns defaults when no values provided", () => {
    expect(validatePagination({})).toEqual({ limit: 50, offset: 0 });
  });

  it("clamps limit to 100 max", () => {
    expect(validatePagination({ limit: "200", offset: "0" })).toEqual({
      limit: 100,
      offset: 0,
    });
  });

  it("resets negative offset to 0", () => {
    expect(validatePagination({ limit: "10", offset: "-5" })).toEqual({
      limit: 10,
      offset: 0,
    });
  });

  it("handles non-numeric inputs gracefully", () => {
    expect(validatePagination({ limit: "abc", offset: "xyz" })).toEqual({
      limit: 50,
      offset: 0,
    });
  });
});

describe("validateSort", () => {
  it("returns defaults when no sort params provided", () => {
    expect(validateSort({})).toEqual({ sortBy: "created_at", sortOrder: "desc" });
  });

  it("accepts valid sort fields", () => {
    expect(validateSort({ sortBy: "name", sortOrder: "asc" })).toEqual({
      sortBy: "name",
      sortOrder: "asc",
    });
  });

  it("falls back to defaults for invalid sort field", () => {
    expect(validateSort({ sortBy: "invalid_field" })).toEqual({
      sortBy: "created_at",
      sortOrder: "desc",
    });
  });
});

describe("validateAnimalFilters", () => {
  it("returns empty filters for empty query", () => {
    expect(validateAnimalFilters({})).toEqual({});
  });

  it("accepts valid status values", () => {
    expect(validateAnimalFilters({ status: "disponible" })).toEqual({
      status: "disponible",
    });
  });

  it("ignores invalid status values", () => {
    expect(validateAnimalFilters({ status: "available" })).toEqual({});
  });

  it("accepts valid size values", () => {
    expect(validateAnimalFilters({ size: "grande" })).toEqual({
      size: "grande",
    });
  });

  it("ignores invalid size values", () => {
    expect(validateAnimalFilters({ size: "gigantic" })).toEqual({});
  });

  it("accepts valid gender values", () => {
    expect(validateAnimalFilters({ gender: "hembra" })).toEqual({
      gender: "hembra",
    });
  });

  it("accepts species and name as free-text search", () => {
    const result = validateAnimalFilters({ species: "Perro", name: "Buddy" });
    expect(result).toEqual({ species: "Perro", name: "Buddy" });
  });
});
