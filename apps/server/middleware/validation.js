/**
 * Input Validation Middleware
 * Validates and sanitizes API request parameters.
 */

const { ApiError } = require("./errorHandler");
const {
  VALID_ANIMAL_GENDERS,
  VALID_ANIMAL_SIZES,
  VALID_ANIMAL_SPECIES,
  VALID_ANIMAL_STATUSES,
  VALID_MEDICAL_RECORD_TYPES,
} = require("../lib/animalData");
const {
  VALID_FILTERS,
  VALID_SORT_FIELDS,
} = require("../repositories/animalsRepository");

/**
 * Sanitizes a string value to prevent injection.
 * @param {string} value - Value to sanitize
 * @returns {string} Sanitized value
 */
function sanitizeString(value) {
  if (typeof value !== "string") return "";
  // Remove potential SQL injection characters and trim
  return value.replace(/[;'"\\]/g, "").trim().slice(0, 100);
}

/**
 * Sanitizes a long text value (e.g., description) to prevent injection.
 * @param {string} value - Value to sanitize
 * @returns {string} Sanitized value
 */
function sanitizeLongText(value) {
  if (typeof value !== "string") return "";
  return value.replace(/[;'"\\]/g, "").trim().slice(0, 1000);
}

function validateMedicalRecordEntry(medicalRecord, fieldPath, options = {}) {
  const {
    allowRecordId = false,
    coerceEmptyOptionalFieldsToNull = false,
  } = options;

  if (!medicalRecord || typeof medicalRecord !== "object" || Array.isArray(medicalRecord)) {
    throw new ApiError(400, `${fieldPath} must be an object.`);
  }

  const validatedMedicalRecord = {};

  if (allowRecordId && medicalRecord.record_id !== undefined) {
    const recordId = Number.parseInt(String(medicalRecord.record_id), 10);

    if (!Number.isInteger(recordId) || recordId < 1) {
      throw new ApiError(400, `Invalid ${fieldPath}.record_id.`);
    }

    validatedMedicalRecord.record_id = recordId;
  }

  if (medicalRecord.record_type !== undefined) {
    const recordType = sanitizeString(medicalRecord.record_type).toLowerCase();
    if (recordType && !VALID_MEDICAL_RECORD_TYPES.includes(recordType)) {
      throw new ApiError(400, `Invalid ${fieldPath}.record_type.`);
    }

    if (recordType) {
      validatedMedicalRecord.record_type = recordType;
    }
  }

  if (medicalRecord.date_given !== undefined) {
    if (medicalRecord.date_given !== null && medicalRecord.date_given !== "") {
      const parsedDate = new Date(medicalRecord.date_given);
      if (Number.isNaN(parsedDate.getTime())) {
        throw new ApiError(400, `Invalid ${fieldPath}.date_given.`);
      }

      validatedMedicalRecord.date_given = parsedDate.toISOString();
    } else if (coerceEmptyOptionalFieldsToNull) {
      validatedMedicalRecord.date_given = null;
    }
  }

  if (medicalRecord.vet_name !== undefined) {
    const vetName = sanitizeString(medicalRecord.vet_name);
    if (vetName) {
      validatedMedicalRecord.vet_name = vetName;
    } else if (coerceEmptyOptionalFieldsToNull) {
      validatedMedicalRecord.vet_name = null;
    }
  }

  if (medicalRecord.notes !== undefined) {
    const notes = sanitizeLongText(medicalRecord.notes);
    if (notes) {
      validatedMedicalRecord.notes = notes;
    } else if (coerceEmptyOptionalFieldsToNull) {
      validatedMedicalRecord.notes = null;
    }
  }

  const hasNonRecordIdFields = Object.keys(validatedMedicalRecord).some((key) => key !== "record_id");

  if (!hasNonRecordIdFields && validatedMedicalRecord.record_id !== undefined) {
    throw new ApiError(
      400,
      `${fieldPath} must include at least one field other than record_id.`
    );
  }

  return hasNonRecordIdFields ? validatedMedicalRecord : undefined;
}

function validateMedicalRecords(reqBody, options = {}) {
  const {
    allowRecordId = false,
    preserveExplicitEmptyArray = false,
    coerceEmptyOptionalFieldsToNull = false,
  } = options;
  const hasSingularMedicalRecord = reqBody.medical_record !== undefined;
  const hasPluralMedicalRecords = reqBody.medical_records !== undefined;

  if (hasSingularMedicalRecord && hasPluralMedicalRecords) {
    throw new ApiError(400, "Provide either medical_record or medical_records, not both.");
  }

  if (hasPluralMedicalRecords) {
    if (!Array.isArray(reqBody.medical_records)) {
      throw new ApiError(400, "medical_records must be an array.");
    }

    const validatedMedicalRecords = reqBody.medical_records
      .map((medicalRecord, index) =>
        validateMedicalRecordEntry(medicalRecord, `medical_records[${index}]`, {
          allowRecordId,
          coerceEmptyOptionalFieldsToNull,
        })
      )
      .filter(Boolean);

    return validatedMedicalRecords.length > 0
      ? validatedMedicalRecords
      : preserveExplicitEmptyArray
        ? []
        : undefined;
  }

  if (hasSingularMedicalRecord) {
    const validatedMedicalRecord = validateMedicalRecordEntry(
      reqBody.medical_record,
      "medical_record",
      {
        allowRecordId,
        coerceEmptyOptionalFieldsToNull,
      }
    );

    return validatedMedicalRecord
      ? [validatedMedicalRecord]
      : preserveExplicitEmptyArray
        ? []
        : undefined;
  }

  return undefined;
}

/**
 * Validates and normalizes an R2 object key.
 * @param {unknown} value - Value to validate
 * @returns {string} Normalized object key
 */
function sanitizeImageObjectKey(value) {
  if (typeof value !== "string") {
    return "";
  }

  const normalizedValue = value.trim().replace(/^\/+/, "").slice(0, 500);
  if (!normalizedValue) {
    return "";
  }

  if (
    normalizedValue.includes("..") ||
    normalizedValue.includes("//")
  ) {
    return "";
  }

  return /^[a-zA-Z0-9/_\-.]+$/.test(normalizedValue)
    ? normalizedValue
    : "";
}

/**
 * Validates pagination parameters.
 * @param {Object} query - Request query parameters
 * @returns {{limit: number, offset: number}}
 */
function validatePagination(query) {
  const limit = parseInt(query.limit, 10);
  const offset = parseInt(query.offset, 10);

  return {
    limit: isNaN(limit) || limit < 1 ? 50 : Math.min(limit, 100),
    offset: isNaN(offset) || offset < 0 ? 0 : offset,
  };
}

/**
 * Validates sort parameters.
 * @param {Object} query - Request query parameters
 * @returns {{sortBy: string, sortOrder: string}}
 */
function validateSort(query) {
  const sortBy = query.sortBy;
  const sortOrder = query.sortOrder?.toLowerCase();

  return {
    sortBy: VALID_SORT_FIELDS.includes(sortBy) ? sortBy : "created_at",
    sortOrder: sortOrder === "asc" ? "asc" : "desc",
  };
}

/**
 * Validates and extracts filter parameters for animals endpoint.
 * @param {Object} query - Request query parameters
 * @returns {Object} Validated filters
 */
function validateAnimalFilters(query) {
  const filters = {};

  // Validate species filter
  if (query.species) {
    filters.species = sanitizeString(query.species);
  }

  // Validate status filter — only filter if explicitly provided
  if (query.status) {
    const status = sanitizeString(query.status);
    if (VALID_ANIMAL_STATUSES.includes(status.toLowerCase())) {
      filters.status = status;
    }
  }

  // Validate size filter
  if (query.size) {
    const size = sanitizeString(query.size);
    if (VALID_ANIMAL_SIZES.includes(size.toLowerCase())) {
      filters.size = size;
    }
  }

  // Validate gender filter
  if (query.gender) {
    const gender = sanitizeString(query.gender);
    if (VALID_ANIMAL_GENDERS.includes(gender.toLowerCase())) {
      filters.gender = gender;
    }
  }

  // Validate name search
  if (query.name) {
    filters.name = sanitizeString(query.name);
  }

  // Validate tags filter (single tag)
  if (query.tags) {
    const cleanedTag = sanitizeString(query.tags).toLowerCase();
    if (/^[\w\s\-]+$/.test(cleanedTag)) {
      filters.tags = cleanedTag;
    }
  }

  // Validate combined search (name + tags)
  // Only allow alphanumeric, spaces, hyphens, and underscores to prevent
  // PostgREST filter injection via special characters like { } , %
  if (query.search) {
    const cleaned = sanitizeString(query.search);
    if (/^[\w\s\-]+$/.test(cleaned)) {
      filters.search = cleaned;
    }
  }

  return filters;
}

/**
 * Middleware to validate animals query parameters.
 */
function validateAnimalsQuery(req, res, next) {
  try {
    // Validate and attach parsed parameters to request
    req.validatedParams = {
      filters: validateAnimalFilters(req.query),
      ...validatePagination(req.query),
      ...validateSort(req.query),
    };
    next();
  } catch (err) {
    next(new ApiError(400, "Invalid query parameters", err.message));
  }
}

/**
 * Middleware to validate animal ID parameter.
 */
function validateAnimalId(req, res, next) {
  const aid = parseInt(req.params.aid, 10);

  if (isNaN(aid) || aid < 1) {
    return next(new ApiError(400, "Invalid animal ID. Must be a positive integer."));
  }

  req.params.aid = aid;
  next();
}

/**
 * Middleware to validate create animal request body.
 */
function validateCreateAnimal(req, res, next) {
  try {
    const name = sanitizeString(req.body.name);
    const description = sanitizeString(req.body.description);
    const species = sanitizeString(req.body.species).toLowerCase();
    const size = sanitizeString(req.body.size).toLowerCase();
    const gender = sanitizeString(req.body.gender).toLowerCase();
    const status = sanitizeString(req.body.status).toLowerCase();
    let image_object_key = "";

    if (!name) {
      throw new ApiError(400, "Name is required.");
    }

    if (!description) {
      throw new ApiError(400, "Description is required.");
    }

    if (!VALID_ANIMAL_SPECIES.includes(species)) {
      throw new ApiError(400, "Invalid species.");
    }

    if (!VALID_ANIMAL_SIZES.includes(size)) {
      throw new ApiError(400, "Invalid size.");
    }

    if (!VALID_ANIMAL_GENDERS.includes(gender)) {
      throw new ApiError(400, "Invalid gender.");
    }

    if (!VALID_ANIMAL_STATUSES.includes(status)) {
      throw new ApiError(400, "Invalid status.");
    }

    if (req.body.image_url !== undefined) {
      throw new ApiError(
        400,
        "image_url is read-only. Use image_object_key for animal images."
      );
    }

    if (req.body.image_object_key !== undefined) {
      image_object_key = sanitizeImageObjectKey(req.body.image_object_key);
      if (!image_object_key) {
        throw new ApiError(400, "Invalid image_object_key.");
      }
    }

    req.validatedBody = {
      name,
      description,
      species,
      size,
      gender,
      status,
    };

    if (image_object_key) {
      req.validatedBody.image_object_key = image_object_key;
    }

    // Handle tags if provided
    if (req.body.tags !== undefined && Array.isArray(req.body.tags)) {
      req.validatedBody.tags = req.body.tags;
    }

    const medicalRecords = validateMedicalRecords(req.body);
    if (medicalRecords) {
      req.validatedBody.medical_records = medicalRecords;
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware to validate update animal request body.
 */
function validateUpdateAnimal(req, res, next) {
  try {
    const updates = {};

    if (req.body.name !== undefined) {
      const name = sanitizeString(req.body.name);
      if (!name) {
        throw new ApiError(400, "Invalid name.");
      }
      updates.name = name;
    }

    if (req.body.description !== undefined) {
      const description = sanitizeLongText(req.body.description);
      if (!description) {
        throw new ApiError(400, "Invalid description.");
      }
      updates.description = description;
    }

    if (req.body.species !== undefined) {
      const species = sanitizeString(req.body.species).toLowerCase();
      if (!VALID_ANIMAL_SPECIES.includes(species)) {
        throw new ApiError(400, "Invalid species.");
      }
      updates.species = species;
    }

    if (req.body.size !== undefined) {
      const size = sanitizeString(req.body.size).toLowerCase();
      if (!VALID_ANIMAL_SIZES.includes(size)) {
        throw new ApiError(400, "Invalid size.");
      }
      updates.size = size;
    }

    if (req.body.gender !== undefined) {
      const gender = sanitizeString(req.body.gender).toLowerCase();
      if (!VALID_ANIMAL_GENDERS.includes(gender)) {
        throw new ApiError(400, "Invalid gender.");
      }
      updates.gender = gender;
    }

    if (req.body.status !== undefined) {
      const status = sanitizeString(req.body.status).toLowerCase();
      if (!VALID_ANIMAL_STATUSES.includes(status)) {
        throw new ApiError(400, "Invalid status.");
      }
      updates.status = status;
    }

    if (req.body.image_url !== undefined) {
      throw new ApiError(
        400,
        "image_url is read-only. Use image_object_key for animal images."
      );
    }

    if (req.body.image_object_key !== undefined) {
      const image_object_key = sanitizeImageObjectKey(req.body.image_object_key);
      if (!image_object_key) {
        throw new ApiError(400, "Invalid image_object_key.");
      }

      updates.image_object_key = image_object_key;
    }

    if (req.body.record_id !== undefined) {
      updates.record_id = req.body.record_id;
    }

    if (req.body.tags !== undefined) {
      if (Array.isArray(req.body.tags)) {
        updates.tags = req.body.tags;
      } else {
        throw new ApiError(400, "Invalid tags format. Tags must be an array.");
      }
    }

    if (
      req.body.medical_records !== undefined ||
      req.body.medical_record !== undefined
    ) {
      updates.medical_records = validateMedicalRecords(req.body, {
        allowRecordId: true,
        preserveExplicitEmptyArray: true,
        coerceEmptyOptionalFieldsToNull: true,
      });
    }

    if (Object.keys(updates).length === 0) {
      throw new ApiError(400, "No valid fields provided for update.");
    }

    req.validatedBody = updates;
    next();
  } catch (err) {
    next(err);
  }
}

function sanitizeLongBlogText(value) {
  if (typeof value !== "string") return "";
  return value.replace(/[;'"\\]/g, "").trim().slice(0, 5000);
}

function validatePostsQuery(req, res, next) {
  try {
    req.validatedParams = validatePagination(req.query);
    next();
  } catch (err) {
    next(new ApiError(400, "Invalid query parameters", err.message));
  }
}

function validatePostId(req, res, next) {
  const pid = parseInt(req.params.pid, 10);
  if (isNaN(pid) || pid < 1) {
    return next(new ApiError(400, "Invalid post ID. Must be a positive integer."));
  }
  req.params.pid = pid;
  next();
}

function validateCreatePost(req, res, next) {
  try {
    const header = sanitizeString(req.body.header);
    const body = sanitizeLongBlogText(req.body.body);

    if (!header) throw new ApiError(400, "header is required.");
    if (header.length > 160) throw new ApiError(400, "header must be 160 characters or fewer.");
    if (!body) throw new ApiError(400, "body is required.");

    if (req.body.image_url !== undefined) {
      throw new ApiError(400, "image_url is read-only. Use image_object_key for post images.");
    }

    const validated = { header, body };

    if (req.body.is_pinned !== undefined) {
      validated.is_pinned = Boolean(req.body.is_pinned);
    }

    if (req.body.image_object_key !== undefined) {
      const key = sanitizeImageObjectKey(req.body.image_object_key);
      if (!key) throw new ApiError(400, "Invalid image_object_key.");
      validated.image_object_key = key;
    }

    req.validatedBody = validated;
    next();
  } catch (err) {
    next(err);
  }
}

function validateUpdatePost(req, res, next) {
  try {
    const updates = {};

    if (req.body.header !== undefined) {
      const header = sanitizeString(req.body.header);
      if (!header) throw new ApiError(400, "Invalid header.");
      if (header.length > 160) throw new ApiError(400, "header must be 160 characters or fewer.");
      updates.header = header;
    }

    if (req.body.body !== undefined) {
      const body = sanitizeLongBlogText(req.body.body);
      if (!body) throw new ApiError(400, "Invalid body.");
      updates.body = body;
    }

    if (req.body.is_pinned !== undefined) {
      updates.is_pinned = Boolean(req.body.is_pinned);
    }

    if (req.body.image_url !== undefined) {
      throw new ApiError(400, "image_url is read-only. Use image_object_key for post images.");
    }

    if (req.body.image_object_key !== undefined) {
      const key = sanitizeImageObjectKey(req.body.image_object_key);
      if (!key) throw new ApiError(400, "Invalid image_object_key.");
      updates.image_object_key = key;
    }

    if (Object.keys(updates).length === 0) {
      throw new ApiError(400, "No valid fields provided for update.");
    }

    req.validatedBody = updates;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  sanitizeString,
  sanitizeImageObjectKey,
  validatePagination,
  validateSort,
  validateAnimalFilters,
  validateAnimalsQuery,
  validateAnimalId,
  validateCreateAnimal,
  validateUpdateAnimal,
  validatePostsQuery,
  validatePostId,
  validateCreatePost,
  validateUpdatePost,
};
