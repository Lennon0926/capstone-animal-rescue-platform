/**
 * Animals Repository
 * Data access layer for animals table using repository pattern.
 */

const { getSupabaseClient } = require("../lib/supabase");
const {
  VALID_MEDICAL_RECORD_TYPES,
  buildMedicalRecordCreateWarning,
  buildMedicalRecordCreationSummary,
  normalizeMedicalRecordFields,
  serializeMedicalRecord,
} = require("../lib/animalData");
const {
  getPublicObjectUrl,
  normalizeObjectKey,
} = require("../services/r2Service");

// In-memory cache for filter options — these change only when animals are
// added/edited, so a 30-second TTL eliminates ~200 redundant DB round-trips
// per second under load without meaningful staleness.
let _filterOptionsCache = null;
let _filterOptionsCachedAt = 0;
const FILTER_OPTIONS_TTL_MS = 30_000;

// In-memory cache for getAnimals() results keyed on serialized query params.
// 10-second TTL balances freshness against DB pool pressure at 50 VU.
// Cleared on any mutation (create/update/delete) to avoid stale listings.
const _animalsCache = new Map();
const ANIMALS_TTL_MS = 10_000;

// Stampede protection: tracks in-flight DB promises per cache key so that
// concurrent requests for the same query share one DB call instead of each
// opening their own connection. Without this, a cold cache under 50 VU fires
// 50 simultaneous Supabase connections and saturates the free-tier pool.
const _animalsInFlight = new Map();

function _animalsQueryKey(options) {
  return JSON.stringify({
    f: options.filters || {},
    l: options.limit ?? 50,
    o: options.offset ?? 0,
    s: options.sortBy ?? "created_at",
    d: options.sortOrder ?? "desc",
  });
}

function _clearAnimalsCache() {
  _animalsCache.clear();
  _filterOptionsCache = null;
}

/**
 * Valid filter fields and their allowed operators
 */
const VALID_FILTERS = {
  species: ["eq", "ilike"],
  status: ["eq"],
  size: ["eq"],
  gender: ["eq"],
  name: ["ilike"],
  tags: ["cs"],
  search: ["or"], // Combined search for name + tags
};

/**
 * Valid sort fields
 */
const VALID_SORT_FIELDS = ["aid", "name", "species", "status", "created_at"];

function normalizeImageUrlValue(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function isExternalImageUrl(imageUrl) {
  if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) {
    return false;
  }

  try {
    const parsedUrl = new URL(imageUrl);
    const hostname = parsedUrl.hostname.toLowerCase();

    if (
      hostname.endsWith(".r2.cloudflarestorage.com") ||
      hostname.endsWith(".r2.dev")
    ) {
      return false;
    }

    const configuredBaseUrl = process.env.R2_PUBLIC_BASE_URL;
    if (configuredBaseUrl) {
      const configuredOrigin = new URL(configuredBaseUrl).origin;
      if (parsedUrl.origin === configuredOrigin) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

function serializeAnimalRecord(animal) {
  if (!animal) {
    return animal;
  }

  const legacyImageUrl = normalizeImageUrlValue(animal.image_url);
  const imageObjectKey = normalizeObjectKey(animal.image_object_key);
  const derivedImageUrl = imageObjectKey
    ? getPublicObjectUrl(imageObjectKey)
    : isExternalImageUrl(legacyImageUrl)
      ? legacyImageUrl
      : null;

  return {
    ...animal,
    image_object_key: imageObjectKey,
    image_url: derivedImageUrl,
  };
}

function normalizeAnimalImageFields(animalData = {}) {
  const normalizedAnimalData = { ...animalData };
  const legacyImageUrl = normalizeImageUrlValue(animalData.image_url);
  const explicitObjectKey = normalizeObjectKey(animalData.image_object_key);

  if (explicitObjectKey) {
    normalizedAnimalData.image_object_key = explicitObjectKey;
    normalizedAnimalData.image_url = getPublicObjectUrl(explicitObjectKey);
    return normalizedAnimalData;
  }

  if (isExternalImageUrl(legacyImageUrl)) {
    normalizedAnimalData.image_url = legacyImageUrl;
  } else {
    delete normalizedAnimalData.image_url;
  }

  return normalizedAnimalData;
}

async function getAnimalRowById(aid) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("animals")
    .select("*")
    .eq("aid", aid)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return { data: null, error: "Animal not found" };
    }

    return { data: null, error: error.message };
  }

  return { data, error: null };
}

async function getMedicalRecordsByAnimalId(aid) {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from("medical_records")
      .select(
        "record_id, aid, record_type, date_given, vet_name, notes, created_at",
      )
      .eq("aid", aid)
      .order("record_id", { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    return {
      data: (data || []).map(serializeMedicalRecord),
      error: null,
    };
  } catch (err) {
    return { data: [], error: err.message };
  }
}

async function getAnimalsRecordView() {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client.from("animalsrecord").select("*");

    if (error) {
      return { data: [], error: error.message };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (err) {
    return { data: [], error: err.message };
  }
}

async function attachMedicalRecordsToAnimal(animal) {
  const medicalRecordsResult = await getMedicalRecordsByAnimalId(animal.aid);

  if (medicalRecordsResult.error) {
    return { data: null, error: medicalRecordsResult.error };
  }

  return {
    data: {
      ...serializeAnimalRecord(animal),
      medical_records: medicalRecordsResult.data,
    },
    error: null,
  };
}

/**
 * Fetches animals with optional filters, sorting, and pagination.
 *
 * @param {Object} options - Query options
 * @param {Object} [options.filters] - Filter criteria (species, status, size, gender, name)
 * @param {string} [options.sortBy] - Field to sort by
 * @param {string} [options.sortOrder] - 'asc' or 'desc'
 * @param {number} [options.limit] - Max number of records (default: 50, max: 100)
 * @param {number} [options.offset] - Number of records to skip (default: 0)
 * @returns {Promise<{data: Array, count: number, error?: string}>}
 */
async function getAnimals(options = {}) {
  const {
    filters = {},
    sortBy = "created_at",
    sortOrder = "desc",
    limit = 50,
    offset = 0,
  } = options;

  const cacheKey = _animalsQueryKey({
    filters,
    limit,
    offset,
    sortBy,
    sortOrder,
  });

  // Cache hit — return immediately
  const cached = _animalsCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < ANIMALS_TTL_MS) {
    return cached.value;
  }

  // Stampede protection — if a DB call for this key is already in flight,
  // wait for it rather than opening a second connection
  if (_animalsInFlight.has(cacheKey)) {
    return _animalsInFlight.get(cacheKey);
  }

  // Cache miss, no in-flight — we are the first; run the DB call and let
  // any concurrent requests for the same key attach to this promise
  const dbCall = (async () => {
    try {
      const client = getSupabaseClient();

      // Start query with count
      let query = client.from("animals").select("*", { count: "exact" });

      // Apply filters
      for (const [field, value] of Object.entries(filters)) {
        if (!value || !VALID_FILTERS[field]) continue;

        if (field === "search") {
          // Combined search: match name OR any tag (case-insensitive)
          query = query.or(
            `name.ilike.%${value}%,tags.cs.{${value.toLowerCase()}}`,
          );
        } else if (VALID_FILTERS[field].includes("ilike") && field === "name") {
          // Partial name match (case-insensitive)
          query = query.ilike(field, `%${value}%`);
        } else if (field === "tags") {
          // Search within tags array (contains)
          query = query.contains(field, [value.toLowerCase()]);
        } else if (
          VALID_FILTERS[field].includes("ilike") &&
          field === "species"
        ) {
          // Species can be exact or partial match
          query = query.ilike(field, `%${value}%`);
        } else {
          // Exact match for status, size, gender
          query = query.eq(field, value);
        }
      }

      // Apply sorting
      const validSortBy = VALID_SORT_FIELDS.includes(sortBy)
        ? sortBy
        : "created_at";
      const validSortOrder = sortOrder === "asc";
      query = query.order(validSortBy, { ascending: validSortOrder });

      // Apply pagination (enforce max limit of 100)
      const safeLimit = Math.min(
        Math.max(1, Number.parseInt(limit, 10) || 50),
        100,
      );
      const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);
      query = query.range(safeOffset, safeOffset + safeLimit - 1);

      const { data, error, count } = await query;

      if (error) {
        return { data: [], count: 0, error: error.message };
      }

      const result = {
        data: (data || []).map(serializeAnimalRecord),
        count: count || 0,
        error: null,
      };
      _animalsCache.set(cacheKey, { value: result, cachedAt: Date.now() });
      return result;
    } catch (err) {
      return { data: [], count: 0, error: err.message };
    } finally {
      _animalsInFlight.delete(cacheKey);
    }
  })();

  _animalsInFlight.set(cacheKey, dbCall);
  return dbCall;
}

/**
 * Fetches a single animal by ID.
 *
 * @param {number} aid - The animal ID
 * @returns {Promise<{data: Object|null, error?: string}>}
 */
async function getAnimalById(aid) {
  try {
    const animalResult = await getAnimalRowById(aid);

    if (animalResult.error) {
      return animalResult;
    }

    return attachMedicalRecordsToAnimal(animalResult.data);
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Returns all animal filter option arrays (species, status, size, gender) in a
 * single RPC call and caches the result for FILTER_OPTIONS_TTL_MS milliseconds.
 *
 * Replaces four separate getDistinctValues() calls that each did a full table
 * scan. Under load this reduces ~200 DB round-trips/s to one call per 30 s.
 *
 * @returns {Promise<{data: {species, status, size, gender} | null, error?: string}>}
 */
async function getFilterOptions() {
  if (
    _filterOptionsCache &&
    Date.now() - _filterOptionsCachedAt < FILTER_OPTIONS_TTL_MS
  ) {
    return { data: _filterOptionsCache, error: null };
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client.rpc("get_animal_filter_options");

    if (error) {
      return { data: null, error: error.message };
    }

    _filterOptionsCache = data;
    _filterOptionsCachedAt = Date.now();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Inserts a new animal record into the database.
 *
 * @param {*} animalData
 * @returns
 */
async function createAnimal(animalData) {
  try {
    const client = getSupabaseClient();
    const normalizedAnimalData = normalizeAnimalImageFields(animalData);

    const { data, error } = await client
      .from("animals")
      .insert(normalizedAnimalData)
      .select("*")
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    _clearAnimalsCache();
    return { data: serializeAnimalRecord(data), error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

async function createMedicalRecord(medicalRecordData) {
  try {
    const client = getSupabaseClient();
    const normalizedMedicalRecord =
      normalizeMedicalRecordFields(medicalRecordData);

    const { data, error } = await client
      .from("medical_records")
      .insert(normalizedMedicalRecord)
      .select("*")
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

async function createAnimalWithInitialMedicalRecords(payload) {
  const { medical_records = [], ...animalData } = payload;
  const medicalRecordsRequested = medical_records.length;
  const animalResult = await createAnimal(animalData);

  if (animalResult.error) {
    return {
      data: null,
      error: animalResult.error,
      ...buildMedicalRecordCreationSummary(medicalRecordsRequested, 0),
    };
  }

  if (medicalRecordsRequested === 0) {
    return {
      data: animalResult.data,
      error: null,
      ...buildMedicalRecordCreationSummary(0, 0),
    };
  }

  const warnings = [];
  let medicalRecordsCreatedCount = 0;

  for (let index = 0; index < medical_records.length; index += 1) {
    const medicalRecordResult = await createMedicalRecord({
      ...medical_records[index],
      aid: animalResult.data.aid,
    });

    if (medicalRecordResult.error) {
      warnings.push(buildMedicalRecordCreateWarning(index));
      continue;
    }

    medicalRecordsCreatedCount += 1;
  }

  return {
    data: animalResult.data,
    error: null,
    ...buildMedicalRecordCreationSummary(
      medicalRecordsRequested,
      medicalRecordsCreatedCount,
      warnings,
    ),
  };
}

/**
 * Deletes an animal record by ID.
 *
 * @param {number} aid
 * @returns
 */
async function deleteAnimal(aid) {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("animals")
      .delete()
      .eq("aid", aid)
      .select("*")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { data: null, error: "Animal not found" };
      }
      return { data: null, error: error.message };
    }

    _clearAnimalsCache();
    return { data: serializeAnimalRecord(data), error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Updates an animal by ID.
 *
 * @param {number} aid - Animal ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<{data: Object|null, error?: string}>}
 */
async function updateAnimalById(aid, updates) {
  try {
    const client = getSupabaseClient();
    const normalizedUpdates = normalizeAnimalImageFields(updates);

    const { data, error } = await client
      .from("animals")
      .update(normalizedUpdates)
      .eq("aid", aid)
      .select("*")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { data: null, error: "Animal not found" };
      }
      return { data: null, error: error.message };
    }

    _clearAnimalsCache();
    return { data: serializeAnimalRecord(data), error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

function serializePatchedAnimalResponse(data) {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    !data.animal
  ) {
    throw new Error(
      "patch_animal_with_medical_records returned an invalid response.",
    );
  }

  return {
    ...serializeAnimalRecord(data.animal),
    medical_records: Array.isArray(data.medical_records)
      ? data.medical_records.map(serializeMedicalRecord)
      : [],
  };
}

function buildMedicalRecordRpcPayload(medicalRecord) {
  const { record_id, ...medicalRecordFields } = medicalRecord;
  const normalizedMedicalRecord =
    normalizeMedicalRecordFields(medicalRecordFields);

  if (record_id !== undefined) {
    normalizedMedicalRecord.record_id = record_id;
  }

  return normalizedMedicalRecord;
}

async function updateAnimalWithMedicalRecordsTransactionById(
  aid,
  animalUpdates,
  medicalRecords,
) {
  try {
    const client = getSupabaseClient();
    const normalizedAnimalUpdates = normalizeAnimalImageFields(animalUpdates);
    const normalizedMedicalRecords = medicalRecords.map(
      buildMedicalRecordRpcPayload,
    );

    const { data, error } = await client.rpc(
      "patch_animal_with_medical_records",
      {
        p_aid: aid,
        p_animal_updates: normalizedAnimalUpdates,
        p_medical_records: normalizedMedicalRecords,
      },
    );

    if (error) {
      if (error.message === "Animal not found") {
        return { data: null, error: "Animal not found" };
      }

      return { data: null, error: error.message };
    }

    _clearAnimalsCache();

    return {
      data: serializePatchedAnimalResponse(data),
      error: null,
    };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

async function updateAnimalWithMedicalRecordsById(aid, updates) {
  const { medical_records, ...animalUpdates } = updates;

  if (medical_records !== undefined) {
    return updateAnimalWithMedicalRecordsTransactionById(
      aid,
      animalUpdates,
      medical_records,
    );
  }

  const animalResult =
    Object.keys(animalUpdates).length > 0
      ? await updateAnimalById(aid, animalUpdates)
      : await getAnimalById(aid);

  if (animalResult.error) {
    return { data: null, error: animalResult.error };
  }

  const medicalRecordsResult = await getMedicalRecordsByAnimalId(aid);

  if (medicalRecordsResult.error) {
    return { data: null, error: medicalRecordsResult.error };
  }

  return {
    data: {
      ...animalResult.data,
      medical_records: medicalRecordsResult.data,
    },
    error: null,
  };
}

module.exports = {
  getAnimals,
  getAnimalById,
  getMedicalRecordsByAnimalId,
  getAnimalsRecordView,
  getFilterOptions,
  createAnimal,
  createAnimalWithInitialMedicalRecords,
  createMedicalRecord,
  deleteAnimal,
  updateAnimalById,
  updateAnimalWithMedicalRecordsById,
  VALID_FILTERS,
  VALID_MEDICAL_RECORD_TYPES,
  VALID_SORT_FIELDS,
  serializeAnimalRecord,
  serializeMedicalRecord,
  normalizeAnimalImageFields,
  clearAnimalsCache: _clearAnimalsCache,
};
