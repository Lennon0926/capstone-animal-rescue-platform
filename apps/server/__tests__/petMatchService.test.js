const {
  rankAnimalsByPrompt,
  cosineSimilarity,
  extractMatchedAttributes,
  buildEmbeddingText,
  serializeEmbedding,
  parseEmbedding,
  detectRequestedSpecies,
  detectRequestedSize,
  detectRequestedGender,
  WEIGHT_SPECIES,
  WEIGHT_SIZE,
  WEIGHT_GENDER,
  WEIGHT_EMBEDDING,
  _resetCacheForTests,
  _setEmbedderForTests,
} = require("../services/petMatchService");

// Deterministic fake embedder: sparse keyword-presence vector over a fixed
// vocab. Cosine over these vectors is high when prompt and tag string share
// keywords. Avoids loading the real ONNX model in CI.
const VOCAB = [
  "perro",
  "gato",
  "mediano",
  "pequeño",
  "grande",
  "tranquilo",
  "activo",
  "amigable",
  "juguetón",
  "niños",
];

function fakeEmbedder() {
  return async (text) => {
    const lower = String(text).toLowerCase();
    const raw = VOCAB.map((token) => (lower.includes(token) ? 1 : 0));
    const norm = Math.sqrt(raw.reduce((sum, v) => sum + v * v, 0)) || 1;
    const data = Float32Array.from(raw.map((v) => v / norm));
    return { data };
  };
}

// Helper that mimics how the repo stores embeddings (pgvector text format).
function embedAsPgvector(text) {
  const lower = String(text).toLowerCase();
  const raw = VOCAB.map((token) => (lower.includes(token) ? 1 : 0));
  const norm = Math.sqrt(raw.reduce((sum, v) => sum + v * v, 0)) || 1;
  return serializeEmbedding(raw.map((v) => v / norm));
}

function makeAnimal(overrides) {
  return {
    aid: 1,
    name: "Test",
    species: "perro",
    size: "mediano",
    gender: "macho",
    status: "disponible",
    tags: [],
    description: "",
    animal_embedding: null,
    ...overrides,
  };
}

beforeEach(() => {
  _resetCacheForTests();
  _setEmbedderForTests(Promise.resolve(fakeEmbedder()));
});

describe("weights add to 1.0", () => {
  it("matches the spec 50 / 15 / 20 / 15", () => {
    expect(WEIGHT_SPECIES + WEIGHT_SIZE + WEIGHT_GENDER + WEIGHT_EMBEDDING)
      .toBeCloseTo(1, 6);
    expect(WEIGHT_SPECIES).toBe(0.5);
    expect(WEIGHT_SIZE).toBe(0.15);
    expect(WEIGHT_GENDER).toBe(0.2);
    expect(WEIGHT_EMBEDDING).toBe(0.15);
  });
});

describe("detectRequested* helpers", () => {
  it("detects species in either language", () => {
    expect(detectRequestedSpecies("quiero un gato")).toBe("gato");
    expect(detectRequestedSpecies("looking for a puppy")).toBe("perro");
    expect(detectRequestedSpecies("busco una mascota")).toBeNull();
  });

  it("detects size including prefix overlap", () => {
    expect(detectRequestedSize("quiero un perro grand")).toBe("grande");
    expect(detectRequestedSize("a medium-sized dog")).toBe("mediano");
    expect(detectRequestedSize("just a dog")).toBeNull();
  });

  it("detects gender", () => {
    expect(detectRequestedGender("una hembra")).toBe("hembra");
    expect(detectRequestedGender("male dog")).toBe("macho");
    expect(detectRequestedGender("any dog")).toBeNull();
  });
});

describe("buildEmbeddingText", () => {
  it("joins tags lowercase with spaces", () => {
    expect(buildEmbeddingText({ tags: ["Friendly", "Active"] })).toBe(
      "friendly active",
    );
  });

  it("returns empty string when no tags", () => {
    expect(buildEmbeddingText({ tags: [] })).toBe("");
    expect(buildEmbeddingText({})).toBe("");
  });
});

describe("parseEmbedding / serializeEmbedding round-trip", () => {
  it("serializes array → pgvector text and parses back", () => {
    const original = [0.1, -0.2, 0.3];
    const text = serializeEmbedding(original);
    expect(text).toBe("[0.1,-0.2,0.3]");
    expect(parseEmbedding(text)).toEqual(original);
  });

  it("handles null and arrays", () => {
    expect(parseEmbedding(null)).toBeNull();
    expect(parseEmbedding([1, 2])).toEqual([1, 2]);
  });
});

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors and 0 for orthogonal", () => {
    expect(cosineSimilarity([0.6, 0.8], [0.6, 0.8])).toBeCloseTo(1, 5);
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
  });
});

describe("rankAnimalsByPrompt — silent prompt + species filter", () => {
  it("scores 'Quiero un gato' high on the only cat and surfaces dogs as alternatives", async () => {
    const daisy = makeAnimal({
      aid: 8,
      name: "Daisy",
      species: "gato",
      size: "pequeño",
      gender: "hembra",
      tags: ["friendly", "active"],
      animal_embedding: embedAsPgvector("friendly active"),
    });
    const dog1 = makeAnimal({
      aid: 21,
      name: "Marley",
      species: "perro",
      size: "muy grande",
      gender: "macho",
      tags: [],
    });
    const dog2 = makeAnimal({
      aid: 35,
      name: "Rocky",
      species: "perro",
      size: "grande",
      gender: "macho",
      tags: [],
    });

    const { matches, alternatives, requestedFields } =
      await rankAnimalsByPrompt({
        prompt: "Quiero un gato",
        animals: [daisy, dog1, dog2],
        // Pin a low threshold so we exercise the alternatives branch; the
        // default 0.5 would (correctly) filter cross-species suggestions out.
        threshold: 0.3,
      });

    expect(requestedFields).toEqual({
      species: true,
      size: false,
      gender: false,
    });

    expect(matches).toHaveLength(1);
    expect(matches[0].animal.aid).toBe(8);
    // 0.5 (species) + 0.15 (silent size) + 0.2 (silent gender) + 0.15·embedding
    // Daisy's embedding is low (no "gato"/"quiero" overlap with tags) but >0.
    expect(matches[0].score).toBeGreaterThanOrEqual(0.85);
    expect(matches[0].componentScores).toEqual({
      species: 1,
      size: 1,
      gender: 1,
      embedding: expect.any(Number),
    });

    // Dogs are penalized only on species → 0 + 0.15 + 0.2 + 0.15·0.5 ≈ 0.425
    expect(alternatives).toHaveLength(2);
    alternatives.forEach((a) => {
      expect(a.animal.species).toBe("perro");
      expect(a.score).toBeLessThan(0.5);
    });
  });
});

describe("rankAnimalsByPrompt — full spec prompt", () => {
  it("perfect 4/4 match scores at the top", async () => {
    const targetDog = makeAnimal({
      aid: 100,
      name: "Bella",
      species: "perro",
      size: "grande",
      gender: "hembra",
      tags: ["amigable"],
      animal_embedding: embedAsPgvector("amigable"),
    });
    const wrongSize = makeAnimal({
      aid: 101,
      name: "Pepe",
      species: "perro",
      size: "mediano",
      gender: "hembra",
      tags: ["amigable"],
      animal_embedding: embedAsPgvector("amigable"),
    });

    const { matches } = await rankAnimalsByPrompt({
      prompt: "Quiero un perro grande hembra amigable",
      animals: [targetDog, wrongSize],
    });

    expect(matches[0].animal.aid).toBe(100);
    expect(matches[0].score).toBeGreaterThan(0.9);
    expect(matches[0].componentScores.species).toBe(1);
    expect(matches[0].componentScores.size).toBe(1);
    expect(matches[0].componentScores.gender).toBe(1);

    // wrongSize: 0.5 + 0 (size) + 0.2 + 0.15·embedding ≈ 0.84
    expect(matches[1].animal.aid).toBe(101);
    expect(matches[1].componentScores.size).toBe(0);
  });
});

describe("rankAnimalsByPrompt — availability + threshold", () => {
  it("ignores animals whose status is not disponible", async () => {
    const unavailable = makeAnimal({
      aid: 1,
      species: "perro",
      status: "adoptado",
    });
    const { matches } = await rankAnimalsByPrompt({
      prompt: "Quiero un perro",
      animals: [unavailable],
    });
    expect(matches).toEqual([]);
  });

  it("caps total recommendations (matches + alternatives) at limit", async () => {
    // 2 cats (matches) + many dogs (would-be alternatives). With limit=5 the
    // total returned (matches.length + alternatives.length) must be ≤ 5.
    const cats = [
      makeAnimal({
        aid: 1,
        species: "gato",
        tags: ["friendly"],
        animal_embedding: embedAsPgvector("friendly"),
      }),
      makeAnimal({
        aid: 2,
        species: "gato",
        tags: ["amigable"],
        animal_embedding: embedAsPgvector("amigable"),
      }),
    ];
    const dogs = Array.from({ length: 6 }, (_, i) =>
      makeAnimal({
        aid: 100 + i,
        species: "perro",
        tags: ["amigable"],
        animal_embedding: embedAsPgvector("amigable"),
      }),
    );

    const { matches, alternatives } = await rankAnimalsByPrompt({
      prompt: "Quiero un gato",
      animals: [...cats, ...dogs],
      threshold: 0.3,
    });

    expect(matches).toHaveLength(2);
    expect(matches.length + alternatives.length).toBeLessThanOrEqual(5);
  });

  it("respects the limit", async () => {
    const animals = Array.from({ length: 5 }, (_, i) =>
      makeAnimal({ aid: i + 1, name: `D${i}`, species: "perro" }),
    );
    const { matches } = await rankAnimalsByPrompt({
      prompt: "perro",
      animals,
      limit: 2,
    });
    expect(matches).toHaveLength(2);
  });

  it("returns empty for an empty animal list", async () => {
    const { matches, alternatives } = await rankAnimalsByPrompt({
      prompt: "perro",
      animals: [],
    });
    expect(matches).toEqual([]);
    expect(alternatives).toEqual([]);
  });

  it("treats off-topic prompts as no-signal even when a size word is present", async () => {
    // "Quiero una casa mediana" hits the size detector but isn't about a pet.
    // The size match must NOT grant credit; with all-silent treatment + 0.4
    // baseline, every animal ends up below the 50% threshold.
    const mediano = makeAnimal({
      aid: 100,
      name: "Pepe",
      species: "perro",
      size: "mediano",
      tags: ["amigable"],
      animal_embedding: embedAsPgvector("amigable"),
    });
    const { matches, alternatives, requestedFields } =
      await rankAnimalsByPrompt({
        prompt: "Quiero una casa mediana",
        animals: [mediano],
      });
    expect(requestedFields).toEqual({
      species: false,
      size: false,
      gender: false,
    });
    expect(matches).toEqual([]);
    expect(alternatives).toEqual([]);
  });

  it("honours size when the prompt is about a pet", async () => {
    const mediano = makeAnimal({
      aid: 100,
      species: "perro",
      size: "mediano",
    });
    const { matches, requestedFields } = await rankAnimalsByPrompt({
      prompt: "Busco una mascota mediana",
      animals: [mediano],
    });
    expect(requestedFields.size).toBe(true);
    expect(matches[0].componentScores.size).toBe(1);
  });

  it("hides matches and alternatives that score below 50% by default", async () => {
    const daisy = makeAnimal({
      aid: 8,
      species: "gato",
      tags: ["friendly"],
      animal_embedding: embedAsPgvector("friendly"),
    });
    const dog = makeAnimal({ aid: 21, species: "perro", tags: [] });

    const { matches, alternatives } = await rankAnimalsByPrompt({
      prompt: "Quiero un gato",
      animals: [daisy, dog],
    });
    // Daisy: 1·0.5 + 1·0.15 + 1·0.2 + 0·0.15 = 0.85 → kept.
    expect(matches.map((m) => m.animal.aid)).toEqual([8]);
    // Dog: 0·0.5 + 1·0.15 + 1·0.2 + 0.5·0.15 = 0.425 → hidden.
    expect(alternatives).toEqual([]);
  });

  it("drops matches below the threshold", async () => {
    // Species mismatch: 0 + 0.15 + 0.2 + 0.075 = 0.425. With threshold 0.6
    // none of the perros qualify for the prompt's requested gato.
    const dog = makeAnimal({
      aid: 1,
      species: "perro",
    });
    const { matches } = await rankAnimalsByPrompt({
      prompt: "Quiero un gato",
      animals: [dog],
      threshold: 0.6,
    });
    expect(matches).toEqual([]);
  });
});

describe("extractMatchedAttributes", () => {
  it("returns labels whose patterns appear in both prompt and animal", () => {
    const animal = makeAnimal({
      species: "perro",
      size: "mediano",
      gender: "hembra",
      description: "Tranquila, buena con niños",
      tags: ["amigable"],
    });
    const matches = extractMatchedAttributes(
      "busco un perro mediano hembra amigable bueno con niños",
      animal,
    );
    expect(matches).toEqual(
      expect.arrayContaining([
        "perro",
        "tamaño mediano",
        "hembra",
        "amigable",
        "bueno con niños",
      ]),
    );
  });
});
