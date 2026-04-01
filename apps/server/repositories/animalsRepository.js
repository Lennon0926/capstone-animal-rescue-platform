/**
 * Animals Repository
 * Data access layer for animals table using repository pattern.
 */

const { getSupabaseClient } = require("../lib/supabase");
const { getPublicObjectUrl, normalizeObjectKey } = require("../services/r2Service");

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

  try {
    const client = getSupabaseClient();

    // Start query with count
    let query = client
      .from("animals")
      .select("*", { count: "exact" });

    // Apply filters
    for (const [field, value] of Object.entries(filters)) {
      if (!value || !VALID_FILTERS[field]) continue;

      if (field === "search") {
        // Combined search: match name OR any tag (case-insensitive)
        query = query.or(`name.ilike.%${value}%,tags.cs.{${value.toLowerCase()}}`);
      } else if (VALID_FILTERS[field].includes("ilike") && field === "name") {
        // Partial name match (case-insensitive)
        query = query.ilike(field, `%${value}%`);
      } else if (field === "tags") {
        // Search within tags array (contains)
        query = query.contains(field, [value.toLowerCase()]);
      } else if (VALID_FILTERS[field].includes("ilike") && field === "species") {
        // Species can be exact or partial match
        query = query.ilike(field, `%${value}%`);
      } else {
        // Exact match for status, size, gender
        query = query.eq(field, value);
      }
    }

    // Apply sorting
    const validSortBy = VALID_SORT_FIELDS.includes(sortBy) ? sortBy : "created_at";
    const validSortOrder = sortOrder === "asc" ? true : false;
    query = query.order(validSortBy, { ascending: validSortOrder });

    // Apply pagination (enforce max limit of 100)
    const safeLimit = Math.min(Math.max(1, parseInt(limit) || 50), 100);
    const safeOffset = Math.max(0, parseInt(offset) || 0);
    query = query.range(safeOffset, safeOffset + safeLimit - 1);

    const { data, error, count } = await query;

    if (error) {
      return { data: [], count: 0, error: error.message };
    }

    return {
      data: (data || []).map(serializeAnimalRecord),
      count: count || 0,
      error: null,
    };
  } catch (err) {
    return { data: [], count: 0, error: err.message };
  }
}

/**
 * Fetches a single animal by ID.
 *
 * @param {number} aid - The animal ID
 * @returns {Promise<{data: Object|null, error?: string}>}
 */
async function getAnimalById(aid) {
  try {
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

    return { data: serializeAnimalRecord(data), error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Gets distinct values for a field (useful for filter dropdowns).
 *
 * @param {string} field - The field to get distinct values for
 * @returns {Promise<{data: Array, error?: string}>}
 */
async function getDistinctValues(field) {
  if (!VALID_FILTERS[field]) {
    return { data: [], error: `Invalid field: ${field}` };
  }

  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from("animals")
      .select(field)
      .not(field, "is", null);

    if (error) {
      return { data: [], error: error.message };
    }

    // Extract unique values
    const uniqueValues = [...new Set(data.map((row) => row[field]))].filter(Boolean);
    return { data: uniqueValues, error: null };
  } catch (err) {
    return { data: [], error: err.message };
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

    return { data: serializeAnimalRecord(data), error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
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

    return { data: serializeAnimalRecord(data), error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

module.exports = {
  getAnimals,
  getAnimalById,
  getDistinctValues,
  createAnimal,
  deleteAnimal,
  updateAnimalById,
  VALID_FILTERS,
  VALID_SORT_FIELDS,
  serializeAnimalRecord,
  normalizeAnimalImageFields,
};
