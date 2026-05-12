/**
 * Pet Match Service
 *
 * Free, on-server semantic matching between a user's natural-language prompt
 * and adoptable pets. Uses Transformers.js with a multilingual sentence-
 * embedding model (paraphrase-multilingual-MiniLM-L12-v2). No paid APIs.
 *
 * Each animal's tag embedding is persisted in the `animals.animal_embedding`
 * pgvector column. The model is loaded once per process; only the user prompt
 * is embedded per request, then cosine-compared against the stored vectors.
 */

const MODEL_ID = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";
const DEFAULT_THRESHOLD = 0.5;
const DEFAULT_LIMIT = 5;

// Score weights — the user-specified compatibility formula.
const WEIGHT_SPECIES = 0.5;
const WEIGHT_SIZE = 0.15;
const WEIGHT_GENDER = 0.2;
const WEIGHT_EMBEDDING = 0.15;

let _embedderPromise = null;

// Bilingual ES/EN keyword dictionaries. Used for detecting what the prompt
// requested (species/size/gender) and for the matchedAttributes chip labels.
const SIZE_TERMS = {
  pequeño: ["pequeño", "pequeña", "chico", "chica", "small", "tiny", "little"],
  mediano: ["mediano", "mediana", "medium", "medio"],
  grande: ["grande", "large", "big"],
  "muy grande": ["muy grande", "extra grande", "huge", "extra large", "xl"],
};

const SPECIES_TERMS = {
  perro: [
    "perro",
    "perra",
    "perrito",
    "perrita",
    "cachorro",
    "cachorra",
    "dog",
    "puppy",
  ],
  gato: [
    "gato",
    "gata",
    "gatito",
    "gatita",
    "michi",
    "minino",
    "cat",
    "kitten",
  ],
};

const GENDER_TERMS = {
  macho: ["macho", "male", "boy"],
  hembra: ["hembra", "female", "girl"],
};

// Generic pet-related vocabulary. Used together with SPECIES_TERMS to decide
// whether the prompt is actually about adopting a pet. A bare size word like
// "mediana" in "Quiero una casa mediana" shouldn't unlock score boosts —
// the prompt has to also mention a pet, an animal, or the adoption intent.
const PET_KEYWORDS = [
  "mascota",
  "mascotas",
  "animal",
  "animalito",
  "animalita",
  "compañero",
  "compañera",
  "peludo",
  "peluda",
  "peludito",
  "peludita",
  "adoptar",
  "adopción",
  "adoption",
  "rescate",
  "pet",
  "puppy",
  "kitten",
];

// Used only to derive the "matchedAttributes" explanation chips.
const KEYWORD_ATTRIBUTES = [
  { label: "tamaño pequeño", patterns: SIZE_TERMS.pequeño },
  { label: "tamaño mediano", patterns: SIZE_TERMS.mediano },
  { label: "tamaño grande", patterns: SIZE_TERMS.grande },
  { label: "tamaño muy grande", patterns: SIZE_TERMS["muy grande"] },
  { label: "perro", patterns: SPECIES_TERMS.perro },
  { label: "gato", patterns: SPECIES_TERMS.gato },
  { label: "macho", patterns: GENDER_TERMS.macho },
  { label: "hembra", patterns: GENDER_TERMS.hembra },
  {
    label: "tranquilo",
    patterns: ["tranquilo", "tranquila", "calmado", "calmada", "calm", "quiet", "relaxed", "chill"],
  },
  {
    label: "activo",
    patterns: ["activo", "activa", "energético", "energética", "active", "energetic", "playful", "juguetón", "juguetona"],
  },
  {
    label: "cariñoso",
    patterns: ["cariñoso", "cariñosa", "afectuoso", "afectuosa", "affectionate", "loving", "cuddly"],
  },
  {
    label: "amigable",
    patterns: ["amigable", "sociable", "friendly", "social"],
  },
  {
    label: "bueno con niños",
    patterns: ["niños", "niña", "niñas", "kids", "children", "kid"],
  },
];

function loadEmbedder() {
  if (!_embedderPromise) {
    _embedderPromise = (async () => {
      // @huggingface/transformers is ESM-only — dynamic import from CJS.
      const { pipeline } = await import("@huggingface/transformers");
      return pipeline("feature-extraction", MODEL_ID, {
        // Quantized model is ~50% smaller with negligible quality loss for
        // short tag/prompt strings.
        dtype: "q8",
      });
    })();
  }
  return _embedderPromise;
}

async function embed(text, embedder) {
  const tensor = await embedder(text, { pooling: "mean", normalize: true });
  // Tensor.data is a Float32Array of normalized embedding values.
  return Array.from(tensor.data);
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
  }
  // Vectors are pre-normalized → dot product equals cosine similarity.
  return dot;
}

function tokenize(text) {
  return String(text).toLowerCase().match(/\p{L}+/gu) || [];
}

// Multi-word terms (e.g. "muy grande") match via substring. Single-word terms
// also accept a prefix overlap of ≥4 chars in either direction so "grand"
// matches "grande" and "trang" matches "tranquilo".
function containsTerm(text, term) {
  if (!text || !term) return false;
  if (term.includes(" ")) return text.includes(term);
  const tokens = tokenize(text);
  return tokens.some(
    (tok) =>
      tok === term ||
      (tok.length >= 4 && term.startsWith(tok)) ||
      (term.length >= 4 && tok.startsWith(term)),
  );
}

function anyTermIn(text, terms) {
  if (!text) return false;
  return terms.some((term) => containsTerm(text, term));
}

function detectRequestedSpecies(promptLower) {
  for (const [species, terms] of Object.entries(SPECIES_TERMS)) {
    if (anyTermIn(promptLower, terms)) return species;
  }
  return null;
}

function detectRequestedSize(promptLower) {
  for (const [size, terms] of Object.entries(SIZE_TERMS)) {
    if (anyTermIn(promptLower, terms)) return size;
  }
  return null;
}

function detectRequestedGender(promptLower) {
  for (const [gender, terms] of Object.entries(GENDER_TERMS)) {
    if (anyTermIn(promptLower, terms)) return gender;
  }
  return null;
}

/**
 * Returns true if the prompt mentions a species or any generic pet keyword,
 * i.e. the user is actually talking about adopting a pet. Used to gate the
 * size/gender boosters so a sentence like "Quiero una casa mediana" doesn't
 * grant size-match credit to every medium animal.
 */
function isPetTopic(promptLower) {
  if (detectRequestedSpecies(promptLower)) return true;
  return anyTermIn(promptLower, PET_KEYWORDS);
}

/**
 * Extract human-readable matched attributes for the explanation chips.
 */
function extractMatchedAttributes(promptLower, animal) {
  const matched = new Set();

  const animalText = [
    animal.name,
    animal.species,
    animal.size,
    animal.gender,
    animal.estimated_age,
    animal.description,
    ...(animal.tags || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  for (const { label, patterns } of KEYWORD_ATTRIBUTES) {
    if (!anyTermIn(promptLower, patterns)) continue;
    if (anyTermIn(animalText, patterns)) matched.add(label);
  }

  if (Array.isArray(animal.tags)) {
    for (const tag of animal.tags) {
      if (
        typeof tag === "string" &&
        containsTerm(promptLower, tag.toLowerCase())
      ) {
        matched.add(tag);
      }
    }
  }

  return Array.from(matched).slice(0, 5);
}

/**
 * Build the text we embed for an animal — the deliberate, curator-defined
 * tags. Returns an empty string when there are no tags (caller stores NULL).
 */
function buildEmbeddingText(animal) {
  if (!Array.isArray(animal?.tags) || animal.tags.length === 0) return "";
  const normalized = animal.tags
    .map((t) => (typeof t === "string" ? t.toLowerCase().trim() : ""))
    .filter(Boolean);
  return normalized.join(" ");
}

/**
 * Generate the 384-dim tag embedding for an animal. Returns null when there
 * are no tags to embed.
 */
async function generateTagEmbedding(animal) {
  const text = buildEmbeddingText(animal);
  if (!text) return null;
  const embedder = await loadEmbedder();
  const vector = await embed(text, embedder);
  return vector;
}

/**
 * Parse the pgvector value returned by Supabase. The JS client returns it
 * as a string like "[0.1,0.2,...]" (or already as an array on some
 * configurations). Returns null when the value is null/empty/malformed.
 */
function parseEmbedding(value) {
  if (!value) return null;
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      const arr = JSON.parse(trimmed);
      return Array.isArray(arr) ? arr : null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Serialize a number[] to the pgvector text format ("[v1,v2,...]") so it can
 * be sent through Supabase's update().
 */
function serializeEmbedding(vector) {
  if (!Array.isArray(vector) || vector.length === 0) return null;
  return `[${vector.join(",")}]`;
}

/**
 * Compute the four-component compatibility score for one animal.
 * Each component is in [0, 1]; the weighted sum is also in [0, 1].
 */
function scoreAnimal({
  animal,
  requestedSpecies,
  requestedSize,
  requestedGender,
  promptVector,
}) {
  const animalSpecies = (animal.species || "").toLowerCase();
  const animalSize = (animal.size || "").toLowerCase();
  const animalGender = (animal.gender || "").toLowerCase();

  // Silent fields default to 1.0 (full credit, "no preference") only when the
  // user gave at least one explicit signal (species/size/gender). For a
  // completely vague prompt with no recognizable preferences, silent fields
  // drop to 0.4 — below the 50% threshold's baseline — so a prompt like
  // "juguete" can't credit every animal up to a passing score on auto-credit
  // alone. Only animals whose tag embedding genuinely aligns with the prompt
  // can clear the bar.
  const anyFieldRequested = Boolean(
    requestedSpecies || requestedSize || requestedGender,
  );
  const silentValue = anyFieldRequested ? 1 : 0.4;

  const speciesScore = requestedSpecies
    ? animalSpecies === requestedSpecies
      ? 1
      : 0
    : silentValue;
  const sizeScore = requestedSize
    ? animalSize === requestedSize
      ? 1
      : 0
    : silentValue;
  const genderScore = requestedGender
    ? animalGender === requestedGender
      ? 1
      : 0
    : silentValue;

  // Embedding: cosine of prompt vs the stored tag vector, clamped to [0,1].
  // Defaults to 0.5 when the animal has no tags/embedding so untagged
  // animals are not penalized for missing data.
  const animalVector = parseEmbedding(animal.animal_embedding);
  let embeddingScore = 0.5;
  if (animalVector && promptVector) {
    embeddingScore = Math.max(0, Math.min(1, cosineSimilarity(promptVector, animalVector)));
  }

  const componentScores = {
    species: speciesScore,
    size: sizeScore,
    gender: genderScore,
    embedding: Number(embeddingScore.toFixed(4)),
  };

  const finalScore =
    WEIGHT_SPECIES * speciesScore +
    WEIGHT_SIZE * sizeScore +
    WEIGHT_GENDER * genderScore +
    WEIGHT_EMBEDDING * embeddingScore;

  return {
    componentScores,
    finalScore: Math.max(0, Math.min(1, finalScore)),
  };
}

/**
 * Rank a list of available animals by compatibility with the prompt.
 *
 * @param {Object} params
 * @param {string} params.prompt - User's natural-language preference text.
 * @param {Array<Object>} params.animals - Candidate animal records (already
 *   filtered to status=disponible by the caller; we also defensively re-filter).
 * @param {number} [params.limit=5]
 * @param {number} [params.threshold=0.3] - Minimum score for primary matches.
 * @returns {Promise<{ matches: Array, alternatives: Array, threshold: number }>}
 */
async function rankAnimalsByPrompt({
  prompt,
  animals,
  limit = DEFAULT_LIMIT,
  threshold = DEFAULT_THRESHOLD,
}) {
  const emptyRequestedFields = { species: false, size: false, gender: false };
  if (!Array.isArray(animals) || animals.length === 0) {
    return {
      matches: [],
      alternatives: [],
      threshold,
      requestedFields: emptyRequestedFields,
    };
  }

  // Defensive availability filter — the route already filters, but this
  // guarantees no caller can leak unavailable animals into the response.
  const available = animals.filter(
    (a) => (a.status || "").toLowerCase() === "disponible",
  );
  if (available.length === 0) {
    return {
      matches: [],
      alternatives: [],
      threshold,
      requestedFields: emptyRequestedFields,
    };
  }

  const promptLower = prompt.toLowerCase();
  const requestedSpecies = detectRequestedSpecies(promptLower);
  // Only honour size/gender when the prompt is actually about a pet, so a
  // bare attribute word in an off-topic sentence ("Quiero una casa mediana")
  // doesn't earn match credit. Species mentions implicitly qualify.
  const petTopic = Boolean(requestedSpecies) || isPetTopic(promptLower);
  const requestedSize = petTopic ? detectRequestedSize(promptLower) : null;
  const requestedGender = petTopic ? detectRequestedGender(promptLower) : null;
  const requestedFields = {
    species: Boolean(requestedSpecies),
    size: Boolean(requestedSize),
    gender: Boolean(requestedGender),
  };

  // Embed the prompt once per request.
  const embedder = await loadEmbedder();
  const promptVector = await embed(prompt, embedder);

  const scored = available.map((animal) => {
    const { componentScores, finalScore } = scoreAnimal({
      animal,
      requestedSpecies,
      requestedSize,
      requestedGender,
      promptVector,
    });
    return { animal, componentScores, finalScore };
  });

  scored.sort((a, b) => b.finalScore - a.finalScore);

  const toMatch = ({ animal, finalScore, componentScores }) => ({
    animal,
    score: Number(finalScore.toFixed(4)),
    matchedAttributes: extractMatchedAttributes(promptLower, animal),
    componentScores,
  });

  // Species was named → matches strictly that species. Alternatives also
  // honour the threshold so we never show animals below the compatibility
  // floor anywhere on the page.
  if (requestedSpecies) {
    const speciesMatches = scored
      .filter(
        (s) => (s.animal.species || "").toLowerCase() === requestedSpecies,
      )
      .filter((s) => s.finalScore >= threshold)
      .slice(0, limit)
      .map(toMatch);

    if (speciesMatches.length === 0) {
      return { matches: [], alternatives: [], threshold, requestedFields };
    }

    // Cap total recommendations (matches + alternatives) at `limit` so the
    // page never shows more than the requested number of animals.
    const alternativesSlots = Math.max(0, limit - speciesMatches.length);
    const alternatives = scored
      .filter(
        (s) => (s.animal.species || "").toLowerCase() !== requestedSpecies,
      )
      .filter((s) => s.finalScore >= threshold)
      .slice(0, alternativesSlots)
      .map(toMatch);

    return {
      matches: speciesMatches,
      alternatives,
      threshold,
      requestedFields,
    };
  }

  const matches = scored
    .filter((s) => s.finalScore >= threshold)
    .slice(0, limit)
    .map(toMatch);

  return { matches, alternatives: [], threshold, requestedFields };
}

function _resetCacheForTests() {
  _embedderPromise = null;
}

function _setEmbedderForTests(promise) {
  _embedderPromise = promise;
}

module.exports = {
  rankAnimalsByPrompt,
  cosineSimilarity,
  extractMatchedAttributes,
  buildEmbeddingText,
  generateTagEmbedding,
  parseEmbedding,
  serializeEmbedding,
  detectRequestedSpecies,
  detectRequestedSize,
  detectRequestedGender,
  WEIGHT_SPECIES,
  WEIGHT_SIZE,
  WEIGHT_GENDER,
  WEIGHT_EMBEDDING,
  _resetCacheForTests,
  _setEmbedderForTests,
};
