const request = require("supertest");

const MOCK_ANIMALS = [
  {
    aid: 1,
    name: "Buddy",
    species: "Dog",
    status: "available",
    size: "medium",
    gender: "male",
    image_object_key: "animals/1/123-photo.jpg",
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    aid: 2,
    name: "Whiskers",
    species: "Cat",
    status: "adopted",
    size: "small",
    gender: "female",
    created_at: "2025-02-01T00:00:00Z",
  },
];

const mockSelect = jest.fn();
const mockFrom = jest.fn(() => ({ select: mockSelect }));
const mockRpc = jest.fn();
const mockAuthGetUser = jest.fn();
const mockSupabaseClient = {
  from: mockFrom,
  rpc: mockRpc,
  auth: {
    getUser: mockAuthGetUser,
  },
};

jest.mock("../lib/supabase", () => ({
  getSupabaseClient: () => mockSupabaseClient,
  verifyConnection: () => Promise.resolve({ connected: true }),
}));

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  process.env.PORT = "4000";
});

afterAll(() => {
  console.error.mockRestore();
});

const getApp = () => require("../server");

function buildChainableMock(resolvedValue) {
  const chain = {};
  const methods = [
    "select",
    "eq",
    "ilike",
    "not",
    "order",
    "range",
    "single",
    "limit",
    "insert",
    "update",
    "delete",
    "contains",
  ];
  for (const m of methods) {
    chain[m] = jest.fn(() => chain);
  }
  chain.then = (resolve) => resolve(resolvedValue);
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
  require("../repositories/animalsRepository").clearAnimalsCache();
  mockAuthGetUser.mockResolvedValue({
    data: { user: { id: "test-user-id" } },
    error: null,
  });
});

const asAuthenticated = (req) =>
  req.set("Authorization", "Bearer test-auth-token");

describe("GET /api/animals", () => {
  it("returns a paginated list of animals", async () => {
    const chain = buildChainableMock({
      data: MOCK_ANIMALS,
      error: null,
      count: 2,
    });
    mockFrom.mockReturnValue(chain);

    const res = await request(getApp()).get("/api/animals");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].image_object_key).toBe("animals/1/123-photo.jpg");
    expect(res.body.data[0].image_url).toBe(
      "https://pub-test-bucket.r2.dev/animals/1/123-photo.jpg",
    );
    expect(res.body.pagination).toMatchObject({
      total: 2,
      limit: 50,
      offset: 0,
    });
  });

  it("accepts valid query parameters for filtering", async () => {
    const chain = buildChainableMock({
      data: [MOCK_ANIMALS[0]],
      error: null,
      count: 1,
    });
    mockFrom.mockReturnValue(chain);

    const res = await request(getApp())
      .get("/api/animals")
      .query({ species: "Dog", status: "available", limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination.limit).toBe(10);
  });

  it("returns 500 when database returns an error", async () => {
    const chain = buildChainableMock({
      data: null,
      error: { message: "DB connection failed" },
      count: 0,
    });
    mockFrom.mockReturnValue(chain);

    const res = await request(getApp()).get("/api/animals");
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe("GET /api/animals/filters", () => {
  it("returns distinct filter values", async () => {
    mockRpc.mockResolvedValue({
      data: {
        species: ["gato", "perro"],
        status: ["adoptado", "disponible"],
        size: ["grande", "mediano"],
        gender: ["hembra", "macho"],
      },
      error: null,
    });

    const res = await request(getApp()).get("/api/animals/filters");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("species");
    expect(res.body.data).toHaveProperty("status");
    expect(res.body.data).toHaveProperty("size");
    expect(res.body.data).toHaveProperty("gender");
  });
});

describe("GET /api/animals/records", () => {
  it("returns all rows from the animalsrecord view", async () => {
    mockFrom.mockImplementation((table) => {
      if (table === "animalsrecord") {
        return buildChainableMock({
          data: [
            {
              aid: 1,
              name: "Buddy",
              record_id: 77,
              record_type: "vacunación",
            },
          ],
          error: null,
        });
      }

      return buildChainableMock({
        data: null,
        error: { message: `Unknown table: ${table}` },
      });
    });

    const res = await asAuthenticated(request(getApp()).get("/api/animals/records"));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([
      expect.objectContaining({
        aid: 1,
        name: "Buddy",
        record_id: 77,
        record_type: "vacunación",
      }),
    ]);
  });

  it("returns 500 when the view query fails", async () => {
    mockFrom.mockImplementation((table) => {
      if (table === "animalsrecord") {
        return buildChainableMock({
          data: null,
          error: { message: "View query failed" },
        });
      }

      return buildChainableMock({
        data: null,
        error: { message: `Unknown table: ${table}` },
      });
    });

    const res = await asAuthenticated(request(getApp()).get("/api/animals/records"));

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(
      /failed to fetch animal medical records/i,
    );
  });
});

describe("GET /api/animals/:aid", () => {
  it("returns a single animal by ID", async () => {
    mockFrom.mockImplementation((table) => {
      if (table === "animals") {
        return buildChainableMock({
          data: MOCK_ANIMALS[0],
          error: null,
        });
      }

      if (table === "medical_records") {
        return buildChainableMock({
          data: [
            {
              record_id: 77,
              aid: 1,
              record_type: "vacunación",
              notes: "Initial vaccine",
            },
          ],
          error: null,
        });
      }

      return buildChainableMock({
        data: null,
        error: { message: "Unknown table" },
      });
    });

    const res = await asAuthenticated(request(getApp()).get("/api/animals/1"));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Buddy");
    expect(res.body.data.medical_records).toEqual([
      expect.objectContaining({ record_id: 77, record_type: "vacunación" }),
    ]);
  });

  it("returns animal with medical_records when unauthenticated", async () => {
    mockFrom.mockImplementation((table) => {
      if (table === "animals") {
        return buildChainableMock({ data: MOCK_ANIMALS[0], error: null });
      }
      if (table === "medical_records") {
        return buildChainableMock({
          data: [{ record_id: 77, aid: 1, record_type: "vacunación" }],
          error: null,
        });
      }
      return buildChainableMock({ data: null, error: { message: "Unknown table" } });
    });

    const res = await request(getApp()).get("/api/animals/1");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Buddy");
    expect(res.body.data.medical_records).toEqual([
      expect.objectContaining({ record_id: 77, record_type: "vacunación" }),
    ]);
  });

  it("returns 404 when animal is not found", async () => {
    const chain = buildChainableMock({
      data: null,
      error: { code: "PGRST116", message: "not found" },
    });
    mockFrom.mockReturnValue(chain);

    const res = await asAuthenticated(request(getApp()).get("/api/animals/999"));
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 for an invalid animal ID", async () => {
    const res = await asAuthenticated(request(getApp()).get("/api/animals/abc"));
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/invalid animal id/i);
  });

  it("returns 400 for negative animal ID", async () => {
    const res = await asAuthenticated(request(getApp()).get("/api/animals/-5"));
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe("404 handler", () => {
  it("returns 404 for undefined routes", async () => {
    const res = await request(getApp()).get("/api/nonexistent");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/route not found/i);
  });
});

describe("POST /api/animals", () => {
  const VALID_CREATE_BODY = {
    name: "Luna",
    description: "Friendly dog looking for a home",
    species: "perro",
    size: "mediano",
    gender: "macho",
    status: "disponible",
  };

  it("returns 401 when auth token is missing", async () => {
    const res = await request(getApp())
      .post("/api/animals")
      .send(VALID_CREATE_BODY);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/authentication required/i);
  });

  it("returns 401 when auth token is invalid or expired", async () => {
    mockAuthGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "invalid JWT" },
    });

    const res = await request(getApp())
      .post("/api/animals")
      .set("Authorization", "Bearer invalid-token")
      .send(VALID_CREATE_BODY);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/invalid or expired/i);
  });

  it("creates a new animal and returns 201", async () => {
    const newAnimal = {
      aid: 3,
      ...VALID_CREATE_BODY,
      created_at: "2026-01-01T00:00:00Z",
    };
    const chain = buildChainableMock({ data: newAnimal, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await asAuthenticated(
      request(getApp()).post("/api/animals"),
    ).send(VALID_CREATE_BODY);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Luna");
    expect(res.body.medicalRecordsAttempted).toBe(false);
    expect(res.body.medicalRecordsRequested).toBe(0);
    expect(res.body.medicalRecordsCreatedCount).toBe(0);
    expect(res.body.medicalRecordCreated).toBe(false);
  });

  it("creates a new animal with multiple initial medical records", async () => {
    const createdAnimal = {
      aid: 3,
      ...VALID_CREATE_BODY,
      record_id: null,
      created_at: "2026-01-01T00:00:00Z",
    };
    const createdMedicalRecords = [
      {
        record_id: 44,
        aid: 3,
        record_type: "vacunación",
        date_given: "2026-04-14T10:00:00.000Z",
        vet_name: "Dr. Rivera",
        notes: "Initial intake vaccination",
      },
      {
        record_id: 45,
        aid: 3,
        record_type: "examen",
        date_given: "2026-04-15T10:00:00.000Z",
        vet_name: "Dr. Soto",
        notes: "Initial wellness exam",
      },
    ];
    let medicalRecordCallCount = 0;

    mockFrom.mockImplementation((table) => {
      if (table === "animals") {
        return buildChainableMock({ data: createdAnimal, error: null });
      }

      if (table === "medical_records") {
        const response = createdMedicalRecords[medicalRecordCallCount];
        medicalRecordCallCount += 1;
        return buildChainableMock({ data: response, error: null });
      }

      return buildChainableMock({
        data: null,
        error: { message: "Unknown table" },
      });
    });

    const res = await asAuthenticated(
      request(getApp()).post("/api/animals"),
    ).send({
      ...VALID_CREATE_BODY,
      medical_records: [
        {
          record_type: "vacunación",
          date_given: "2026-04-14T10:00:00.000Z",
          vet_name: "Dr. Rivera",
          notes: "Initial intake vaccination",
        },
        {
          record_type: "examen",
          date_given: "2026-04-15T10:00:00.000Z",
          vet_name: "Dr. Soto",
          notes: "Initial wellness exam",
        },
      ],
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.medicalRecordsAttempted).toBe(true);
    expect(res.body.medicalRecordsRequested).toBe(2);
    expect(res.body.medicalRecordsCreatedCount).toBe(2);
    expect(res.body.medicalRecordCreated).toBe(true);
    expect(res.body.data.record_id).toBeNull();
  });

  it("returns 400 for an invalid medical_records entry type", async () => {
    const res = await asAuthenticated(
      request(getApp()).post("/api/animals"),
    ).send({
      ...VALID_CREATE_BODY,
      medical_records: [
        {
          record_type: "vacunación",
        },
        {
          record_type: "consulta",
        },
      ],
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(
      /medical_records\[1\]\.record_type/i,
    );
  });

  it("returns 400 for a malformed medical_records date", async () => {
    const res = await asAuthenticated(
      request(getApp()).post("/api/animals"),
    ).send({
      ...VALID_CREATE_BODY,
      medical_records: [
        {
          date_given: "not-a-date",
        },
      ],
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/medical_records\[0\]\.date_given/i);
  });

  it("returns a partial-success warning when some medical records fail after the animal is created", async () => {
    const createdAnimal = {
      aid: 3,
      ...VALID_CREATE_BODY,
      record_id: null,
      created_at: "2026-01-01T00:00:00Z",
    };

    mockFrom.mockImplementation((table) => {
      if (table === "animals") {
        return buildChainableMock({ data: createdAnimal, error: null });
      }

      if (table === "medical_records") {
        if (
          mockFrom.mock.calls.filter(([name]) => name === "medical_records")
            .length === 1
        ) {
          return buildChainableMock({
            data: {
              record_id: 44,
              aid: 3,
              record_type: "vacunación",
            },
            error: null,
          });
        }

        return buildChainableMock({
          data: null,
          error: { message: "insert failed" },
        });
      }

      return buildChainableMock({
        data: null,
        error: { message: "Unknown table" },
      });
    });

    const res = await asAuthenticated(
      request(getApp()).post("/api/animals"),
    ).send({
      ...VALID_CREATE_BODY,
      medical_records: [
        {
          record_type: "vacunación",
          notes: "Initial intake vaccination",
        },
        {
          record_type: "examen",
          notes: "Follow-up exam",
        },
      ],
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.record_id).toBeNull();
    expect(res.body.medicalRecordsAttempted).toBe(true);
    expect(res.body.medicalRecordsRequested).toBe(2);
    expect(res.body.medicalRecordsCreatedCount).toBe(1);
    expect(res.body.medicalRecordCreated).toBe(false);
    expect(res.body.warnings).toEqual([
      expect.objectContaining({
        code: "MEDICAL_RECORD_CREATE_FAILED",
        index: 1,
      }),
    ]);
  });

  it("returns 400 when name is missing", async () => {
    const { name, ...body } = VALID_CREATE_BODY;
    const res = await asAuthenticated(
      request(getApp()).post("/api/animals"),
    ).send(body);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/name is required/i);
  });

  it("returns 400 when description is missing", async () => {
    const { description, ...body } = VALID_CREATE_BODY;
    const res = await asAuthenticated(
      request(getApp()).post("/api/animals"),
    ).send(body);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/description is required/i);
  });

  it("returns 400 when species is invalid", async () => {
    const res = await request(getApp())
      .post("/api/animals")
      .set("Authorization", "Bearer test-auth-token")
      .send({ ...VALID_CREATE_BODY, species: "hamster" });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/invalid species/i);
  });

  it("returns 400 when size is invalid", async () => {
    const res = await request(getApp())
      .post("/api/animals")
      .set("Authorization", "Bearer test-auth-token")
      .send({ ...VALID_CREATE_BODY, size: "tiny" });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/invalid size/i);
  });

  it("returns 400 when gender is invalid", async () => {
    const res = await request(getApp())
      .post("/api/animals")
      .set("Authorization", "Bearer test-auth-token")
      .send({ ...VALID_CREATE_BODY, gender: "other" });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/invalid gender/i);
  });

  it("returns 400 when status is invalid", async () => {
    const res = await request(getApp())
      .post("/api/animals")
      .set("Authorization", "Bearer test-auth-token")
      .send({ ...VALID_CREATE_BODY, status: "available" });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/invalid status/i);
  });

  it("returns 400 when image_url is provided", async () => {
    const res = await request(getApp())
      .post("/api/animals")
      .set("Authorization", "Bearer test-auth-token")
      .send({
        ...VALID_CREATE_BODY,
        image_url: "https://example.com/photo.jpg",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/image_url is read-only/i);
  });

  it("creates animal with image_object_key", async () => {
    const newAnimal = {
      aid: 3,
      ...VALID_CREATE_BODY,
      image_object_key: "animals/3/photo.jpg",
    };
    const chain = buildChainableMock({ data: newAnimal, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(getApp())
      .post("/api/animals")
      .set("Authorization", "Bearer test-auth-token")
      .send({ ...VALID_CREATE_BODY, image_object_key: "animals/3/photo.jpg" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("creates animal with tags array", async () => {
    const newAnimal = {
      aid: 3,
      ...VALID_CREATE_BODY,
      tags: ["vaccinated", "friendly"],
    };
    const chain = buildChainableMock({ data: newAnimal, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(getApp())
      .post("/api/animals")
      .set("Authorization", "Bearer test-auth-token")
      .send({ ...VALID_CREATE_BODY, tags: ["vaccinated", "friendly"] });

    expect(res.status).toBe(201);
    expect(res.body.data.tags).toEqual(["vaccinated", "friendly"]);
  });

  it("returns 500 when database returns an error", async () => {
    const chain = buildChainableMock({
      data: null,
      error: { message: "DB connection failed" },
    });
    mockFrom.mockReturnValue(chain);

    const res = await asAuthenticated(
      request(getApp()).post("/api/animals"),
    ).send(VALID_CREATE_BODY);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe("DELETE /api/animals/:aid", () => {
  it("returns 401 when auth token is missing", async () => {
    const res = await request(getApp()).delete("/api/animals/1");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/authentication required/i);
  });

  it("returns 401 when auth token is invalid or expired", async () => {
    mockAuthGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "invalid JWT" },
    });

    const res = await request(getApp())
      .delete("/api/animals/1")
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/invalid or expired/i);
  });

  it("deletes an animal and returns 200 with the deleted record", async () => {
    const chain = buildChainableMock({ data: MOCK_ANIMALS[0], error: null });
    mockFrom.mockReturnValue(chain);

    const res = await asAuthenticated(
      request(getApp()).delete("/api/animals/1"),
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Buddy");
  });

  it("returns 404 when animal is not found", async () => {
    const chain = buildChainableMock({
      data: null,
      error: { code: "PGRST116", message: "not found" },
    });
    mockFrom.mockReturnValue(chain);

    const res = await asAuthenticated(
      request(getApp()).delete("/api/animals/999"),
    );

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 for an invalid animal ID", async () => {
    const res = await asAuthenticated(
      request(getApp()).delete("/api/animals/abc"),
    );

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/invalid animal id/i);
  });

  it("returns 400 for a negative animal ID", async () => {
    const res = await asAuthenticated(
      request(getApp()).delete("/api/animals/-1"),
    );

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 500 when database returns an error", async () => {
    const chain = buildChainableMock({
      data: null,
      error: { message: "DB connection failed" },
    });
    mockFrom.mockReturnValue(chain);

    const res = await asAuthenticated(
      request(getApp()).delete("/api/animals/1"),
    );

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe("PATCH /api/animals/:aid", () => {
  it("returns 401 when auth token is missing", async () => {
    const res = await request(getApp())
      .patch("/api/animals/1")
      .send({ name: "No Auth" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/authentication required/i);
  });

  it("returns 401 when auth token is invalid or expired", async () => {
    mockAuthGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "invalid JWT" },
    });

    const res = await request(getApp())
      .patch("/api/animals/1")
      .set("Authorization", "Bearer invalid-token")
      .send({ name: "No Auth" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/invalid or expired/i);
  });

  it("updates an animal and returns 200 with the updated record", async () => {
    const updated = { ...MOCK_ANIMALS[0], name: "Buddy Updated" };
    mockFrom.mockImplementation((table) => {
      if (table === "animals") {
        return buildChainableMock({ data: updated, error: null });
      }

      if (table === "medical_records") {
        return buildChainableMock({ data: [], error: null });
      }

      return buildChainableMock({
        data: null,
        error: { message: "Unknown table" },
      });
    });

    const res = await request(getApp())
      .patch("/api/animals/1")
      .set("Authorization", "Bearer test-auth-token")
      .send({ name: "Buddy Updated" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Buddy Updated");
  });

  it("accepts partial update with a single field", async () => {
    const updated = { ...MOCK_ANIMALS[0], status: "adoptado" };
    mockFrom.mockImplementation((table) => {
      if (table === "animals") {
        return buildChainableMock({ data: updated, error: null });
      }

      if (table === "medical_records") {
        return buildChainableMock({ data: [], error: null });
      }

      return buildChainableMock({
        data: null,
        error: { message: "Unknown table" },
      });
    });

    const res = await request(getApp())
      .patch("/api/animals/1")
      .set("Authorization", "Bearer test-auth-token")
      .send({ status: "adoptado" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("updates medical records alongside the animal", async () => {
    const updatedAnimal = {
      ...MOCK_ANIMALS[0],
      description: "Updated description",
    };
    mockRpc.mockResolvedValue({
      data: {
        animal: updatedAnimal,
        medical_records: [
          {
            record_id: 21,
            aid: 1,
            record_type: "vacunación",
            notes: "Updated note",
          },
          {
            record_id: 23,
            aid: 1,
            record_type: "tratamiento",
            notes: "New record",
          },
        ],
      },
      error: null,
    });

    const res = await request(getApp())
      .patch("/api/animals/1")
      .set("Authorization", "Bearer test-auth-token")
      .send({
        description: "Updated description",
        medical_records: [
          {
            record_id: 21,
            record_type: "vacunación",
            notes: "Updated note",
          },
          {
            record_type: "tratamiento",
            notes: "New record",
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.description).toBe("Updated description");
    expect(res.body.data.medical_records).toEqual([
      expect.objectContaining({ record_id: 21, notes: "Updated note" }),
      expect.objectContaining({ record_id: 23, notes: "New record" }),
    ]);
    expect(mockRpc).toHaveBeenCalledWith("patch_animal_with_medical_records", {
      p_aid: 1,
      p_animal_updates: {
        description: "Updated description",
      },
      p_medical_records: [
        {
          record_id: 21,
          record_type: "vacunación",
          notes: "Updated note",
        },
        {
          record_type: "tratamiento",
          notes: "New record",
        },
      ],
    });
  });

  it("returns 500 when the transactional medical record sync fails", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "Medical record 999 does not belong to animal 1." },
    });

    const res = await request(getApp())
      .patch("/api/animals/1")
      .set("Authorization", "Bearer test-auth-token")
      .send({
        description: "Updated description",
        medical_records: [
          {
            record_id: 999,
            record_type: "vacunación",
          },
        ],
      });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/failed to update animal/i);
    expect(mockRpc).toHaveBeenCalledWith("patch_animal_with_medical_records", {
      p_aid: 1,
      p_animal_updates: {
        description: "Updated description",
      },
      p_medical_records: [
        {
          record_id: 999,
          record_type: "vacunación",
        },
      ],
    });
  });

  it("returns 404 when animal is not found", async () => {
    const chain = buildChainableMock({
      data: null,
      error: { code: "PGRST116", message: "not found" },
    });
    mockFrom.mockReturnValue(chain);

    const res = await request(getApp())
      .patch("/api/animals/999")
      .set("Authorization", "Bearer test-auth-token")
      .send({ name: "Ghost Animal" });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 for an invalid animal ID", async () => {
    const res = await request(getApp())
      .patch("/api/animals/abc")
      .set("Authorization", "Bearer test-auth-token")
      .send({ name: "Test" });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/invalid animal id/i);
  });

  it("returns 400 when no valid update fields are provided", async () => {
    const res = await asAuthenticated(
      request(getApp()).patch("/api/animals/1"),
    ).send({});

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/no valid fields/i);
  });

  it("returns 400 when image_url is provided", async () => {
    const res = await request(getApp())
      .patch("/api/animals/1")
      .set("Authorization", "Bearer test-auth-token")
      .send({ image_url: "https://example.com/photo.jpg" });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/image_url is read-only/i);
  });

  it("returns 400 when tags is not an array", async () => {
    const res = await request(getApp())
      .patch("/api/animals/1")
      .set("Authorization", "Bearer test-auth-token")
      .send({ tags: "vaccinated" });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/invalid tags format/i);
  });

  it("accepts tags array in an update", async () => {
    const updated = { ...MOCK_ANIMALS[0], tags: ["friendly", "vaccinated"] };
    mockFrom.mockImplementation((table) => {
      if (table === "animals") {
        return buildChainableMock({ data: updated, error: null });
      }

      if (table === "medical_records") {
        return buildChainableMock({ data: [], error: null });
      }

      return buildChainableMock({
        data: null,
        error: { message: "Unknown table" },
      });
    });

    const res = await request(getApp())
      .patch("/api/animals/1")
      .set("Authorization", "Bearer test-auth-token")
      .send({ tags: ["friendly", "vaccinated"] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("returns 500 when database returns an error", async () => {
    const chain = buildChainableMock({
      data: null,
      error: { message: "DB connection failed" },
    });
    mockFrom.mockReturnValue(chain);

    const res = await request(getApp())
      .patch("/api/animals/1")
      .set("Authorization", "Bearer test-auth-token")
      .send({ name: "Updated" });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  it("sends an empty medical_records array to the RPC, deleting all existing records", async () => {
    const updatedAnimal = { ...MOCK_ANIMALS[0] };
    mockRpc.mockResolvedValue({
      data: { animal: updatedAnimal, medical_records: [] },
      error: null,
    });

    const res = await request(getApp())
      .patch("/api/animals/1")
      .set("Authorization", "Bearer test-auth-token")
      .send({ name: "Buddy", medical_records: [] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.medical_records).toEqual([]);
    expect(mockRpc).toHaveBeenCalledWith("patch_animal_with_medical_records", {
      p_aid: 1,
      p_animal_updates: { name: "Buddy" },
      p_medical_records: [],
    });
  });
});
