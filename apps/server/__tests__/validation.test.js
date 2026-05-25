const {
  sanitizeString,
  sanitizeImageObjectKey,
  validatePagination,
  validateSort,
  validateAnimalFilters,
  validateCreateAnimal,
  validateUpdateAnimal,
  validateAiMatchBody,
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

describe("sanitizeImageObjectKey", () => {
  it("accepts valid R2 object keys", () => {
    expect(sanitizeImageObjectKey("animals/12/123-photo.jpg")).toBe(
      "animals/12/123-photo.jpg"
    );
  });

  it("rejects invalid object keys", () => {
    expect(sanitizeImageObjectKey("../animals/12")).toBe("");
    expect(sanitizeImageObjectKey("animals/12/my photo.jpg")).toBe("");
  });
});

describe("image object key middleware validation", () => {
  it("rejects image_url on create", () => {
    const req = {
      body: {
        name: "Luna",
        description: "Friendly dog",
        species: "Perro",
        size: "Grande",
        gender: "Hembra",
        status: "Disponible",
        image_url: "https://pub-test-bucket.r2.dev/animals/12/123-photo.jpg",
      },
    };
    const next = jest.fn();

    validateCreateAnimal(req, {}, next);

    expect(next.mock.calls[0][0].message).toMatch(/image_url is read-only/i);
  });

  it("accepts image_object_key on create", () => {
    const req = {
      body: {
        name: "Luna",
        description: "Friendly dog",
        species: "Perro",
        size: "Grande",
        gender: "Hembra",
        status: "Disponible",
        image_object_key: "animals/12/123-photo.jpg",
      },
    };
    const next = jest.fn();

    validateCreateAnimal(req, {}, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.validatedBody.image_object_key).toBe("animals/12/123-photo.jpg");
  });

  it("accepts image_object_key on update", () => {
    const req = {
      body: {
        image_object_key: "animals/12/123-photo.jpg",
      },
    };
    const next = jest.fn();

    validateUpdateAnimal(req, {}, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.validatedBody.image_object_key).toBe("animals/12/123-photo.jpg");
  });

  it("rejects invalid image_object_key on update", () => {
    const req = {
      body: {
        image_object_key: "animals/12/my photo.jpg",
      },
    };
    const next = jest.fn();

    validateUpdateAnimal(req, {}, next);

    expect(next.mock.calls[0][0].message).toMatch(/invalid image_object_key/i);
  });

  it("rejects image_url on update", () => {
    const req = {
      body: {
        image_url: "https://pub-test-bucket.r2.dev/animals/12/123-photo.jpg",
      },
    };
    const next = jest.fn();

    validateUpdateAnimal(req, {}, next);

    expect(next.mock.calls[0][0].message).toMatch(/image_url is read-only/i);
  });

  it("accepts medical_records on update", () => {
    const req = {
      body: {
        medical_records: [
          {
            record_id: 10,
            record_type: "Vacunación",
            date_given: "2026-04-14T10:00:00.000Z",
            vet_name: "Dr. Rivera",
            notes: "Updated vaccine note",
          },
          {
            record_type: "Examen",
            notes: "New exam note",
          },
        ],
      },
    };
    const next = jest.fn();

    validateUpdateAnimal(req, {}, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.validatedBody.medical_records).toEqual([
      {
        record_id: 10,
        record_type: "vacunación",
        date_given: "2026-04-14T10:00:00.000Z",
        vet_name: "Dr. Rivera",
        notes: "Updated vaccine note",
      },
      {
        record_type: "examen",
        notes: "New exam note",
      },
    ]);
  });

  it("normalizes blank optional medical record fields to null on update", () => {
    const req = {
      body: {
        medical_records: [
          {
            record_id: 10,
            record_type: "Vacunación",
            date_given: "",
            vet_name: "",
            notes: "",
          },
        ],
      },
    };
    const next = jest.fn();

    validateUpdateAnimal(req, {}, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.validatedBody.medical_records).toEqual([
      {
        record_id: 10,
        record_type: "vacunación",
        date_given: null,
        vet_name: null,
        notes: null,
      },
    ]);
  });

  it("preserves omission semantics for optional medical record fields on update", () => {
    const req = {
      body: {
        medical_records: [
          {
            record_id: 10,
            record_type: "Vacunación",
          },
        ],
      },
    };
    const next = jest.fn();

    validateUpdateAnimal(req, {}, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.validatedBody.medical_records).toEqual([
      {
        record_id: 10,
        record_type: "vacunación",
      },
    ]);
  });

  it("accepts an empty medical_records array on update", () => {
    const req = {
      body: {
        medical_records: [],
      },
    };
    const next = jest.fn();

    validateUpdateAnimal(req, {}, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.validatedBody.medical_records).toEqual([]);
  });

  it("rejects a medical_records entry that contains only record_id on update", () => {
    const req = {
      body: {
        medical_records: [{ record_id: 5 }],
      },
    };
    const next = jest.fn();

    validateUpdateAnimal(req, {}, next);

    expect(next.mock.calls[0][0].statusCode).toBe(400);
    expect(next.mock.calls[0][0].message).toMatch(/record_id/i);
  });

  it("rejects invalid medical_records.record_id on update", () => {
    const req = {
      body: {
        medical_records: [
          {
            record_id: "abc",
            record_type: "vacunación",
          },
        ],
      },
    };
    const next = jest.fn();

    validateUpdateAnimal(req, {}, next);

    expect(next.mock.calls[0][0].message).toMatch(/medical_records\[0\]\.record_id/i);
  });
});

describe("validateAiMatchBody", () => {
  it("returns 400 when prompt is missing", () => {
    const req = { body: {} };
    const next = jest.fn();
    validateAiMatchBody(req, {}, next);
    expect(next.mock.calls[0][0].statusCode).toBe(400);
    expect(next.mock.calls[0][0].message).toMatch(/prompt is required/i);
  });

  it("returns 400 when prompt is not a string", () => {
    const req = { body: { prompt: 42 } };
    const next = jest.fn();
    validateAiMatchBody(req, {}, next);
    expect(next.mock.calls[0][0].statusCode).toBe(400);
    expect(next.mock.calls[0][0].message).toMatch(/prompt is required/i);
  });

  it("returns 400 when prompt is too short (< 3 chars after trim)", () => {
    const req = { body: { prompt: "ab" } };
    const next = jest.fn();
    validateAiMatchBody(req, {}, next);
    expect(next.mock.calls[0][0].statusCode).toBe(400);
    expect(next.mock.calls[0][0].message).toMatch(/at least 3 characters/i);
  });

  it("returns 400 when prompt is blank whitespace", () => {
    const req = { body: { prompt: "   " } };
    const next = jest.fn();
    validateAiMatchBody(req, {}, next);
    expect(next.mock.calls[0][0].statusCode).toBe(400);
  });

  it("returns 400 when prompt exceeds 500 characters", () => {
    const req = { body: { prompt: "a".repeat(501) } };
    const next = jest.fn();
    validateAiMatchBody(req, {}, next);
    expect(next.mock.calls[0][0].statusCode).toBe(400);
    expect(next.mock.calls[0][0].message).toMatch(/500 characters/i);
  });

  it("returns 400 when limit is non-numeric", () => {
    const req = { body: { prompt: "quiero un perro", limit: "abc" } };
    const next = jest.fn();
    validateAiMatchBody(req, {}, next);
    expect(next.mock.calls[0][0].statusCode).toBe(400);
    expect(next.mock.calls[0][0].message).toMatch(/integer between 1 and 20/i);
  });

  it("returns 400 when limit is below 1", () => {
    const req = { body: { prompt: "quiero un perro", limit: 0 } };
    const next = jest.fn();
    validateAiMatchBody(req, {}, next);
    expect(next.mock.calls[0][0].statusCode).toBe(400);
  });

  it("returns 400 when limit is above 20", () => {
    const req = { body: { prompt: "quiero un perro", limit: 21 } };
    const next = jest.fn();
    validateAiMatchBody(req, {}, next);
    expect(next.mock.calls[0][0].statusCode).toBe(400);
  });

  it("defaults limit to 5 when not provided", () => {
    const req = { body: { prompt: "quiero un perro" } };
    const next = jest.fn();
    validateAiMatchBody(req, {}, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.validatedBody).toEqual({ prompt: "quiero un perro", limit: 5 });
  });

  it("accepts a valid prompt and custom limit", () => {
    const req = { body: { prompt: "  perro mediano  ", limit: 10 } };
    const next = jest.fn();
    validateAiMatchBody(req, {}, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.validatedBody).toEqual({ prompt: "perro mediano", limit: 10 });
  });

  it("trims leading and trailing whitespace from prompt", () => {
    const req = { body: { prompt: "  gato tranquilo  " } };
    const next = jest.fn();
    validateAiMatchBody(req, {}, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.validatedBody.prompt).toBe("gato tranquilo");
  });

  it("accepts a prompt exactly 500 characters long", () => {
    const req = { body: { prompt: "a".repeat(500) } };
    const next = jest.fn();
    validateAiMatchBody(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("accepts limit = 1 (lower boundary)", () => {
    const req = { body: { prompt: "quiero un perro", limit: 1 } };
    const next = jest.fn();
    validateAiMatchBody(req, {}, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.validatedBody.limit).toBe(1);
  });

  it("accepts limit = 20 (upper boundary)", () => {
    const req = { body: { prompt: "quiero un perro", limit: 20 } };
    const next = jest.fn();
    validateAiMatchBody(req, {}, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.validatedBody.limit).toBe(20);
  });
});
