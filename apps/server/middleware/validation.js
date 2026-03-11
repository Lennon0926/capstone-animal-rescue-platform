/**
 * Input Validation Middleware
 * Validates and sanitizes API request parameters.
 */

const { ApiError } = require("./errorHandler");
const { VALID_FILTERS, VALID_SORT_FIELDS } = require("../repositories/animalsRepository");

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

  // Validate status filter
  if (query.status) {
    const status = sanitizeString(query.status);
    const validStatuses = ["available", "adopted", "pending", "fostered", "medical_hold"];
    if (validStatuses.includes(status.toLowerCase())) {
      filters.status = status;
    }
  }

  // Validate size filter
  if (query.size) {
    const size = sanitizeString(query.size);
    const validSizes = ["small", "medium", "large", "extra_large"];
    if (validSizes.includes(size.toLowerCase())) {
      filters.size = size;
    }
  }

  // Validate gender filter
  if (query.gender) {
    const gender = sanitizeString(query.gender);
    const validGenders = ["male", "female", "unknown"];
    if (validGenders.includes(gender.toLowerCase())) {
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
    const image_url = typeof req.body.image_url === "string"
      ? req.body.image_url.trim().slice(0, 500)
      : "";

    const validSpecies = ["dog", "cat"];
    const validSizes = ["small", "medium", "large", "extra_large"];
    const validGenders = ["male", "female", "unknown"];
    const validStatuses = ["available", "adopted", "pending", "fostered", "medical_hold"];

    if (!name) {
      throw new ApiError(400, "Name is required.");
    }

    if (!description) {
      throw new ApiError(400, "Description is required.");
    }

    if (!validSpecies.includes(species)) {
      throw new ApiError(400, "Invalid species.");
    }

    if (!validSizes.includes(size)) {
      throw new ApiError(400, "Invalid size.");
    }

    if (!validGenders.includes(gender)) {
      throw new ApiError(400, "Invalid gender.");
    }

    if (!validStatuses.includes(status)) {
      throw new ApiError(400, "Invalid status.");
    }

    if (!image_url) {
      throw new ApiError(400, "Image URL is required.");
    }

    req.validatedBody = {
      name,
      description,
      species,
      size,
      gender,
      status,
      image_url,
    };

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
      const validSpecies = ["dog", "cat"];
      if (!validSpecies.includes(species)) {
        throw new ApiError(400, "Invalid species.");
      }
      updates.species = species;
    }

    if (req.body.size !== undefined) {
      const size = sanitizeString(req.body.size).toLowerCase();
      const validSizes = ["small", "medium", "large", "extra_large"];
      if (!validSizes.includes(size)) {
        throw new ApiError(400, "Invalid size.");
      }
      updates.size = size;
    }

    if (req.body.gender !== undefined) {
      const gender = sanitizeString(req.body.gender).toLowerCase();
      const validGenders = ["male", "female", "unknown"];
      if (!validGenders.includes(gender)) {
        throw new ApiError(400, "Invalid gender.");
      }
      updates.gender = gender;
    }

    if (req.body.status !== undefined) {
      const status = sanitizeString(req.body.status).toLowerCase();
      const validStatuses = ["available", "adopted", "pending", "fostered", "medical_hold"];
      if (!validStatuses.includes(status)) {
        throw new ApiError(400, "Invalid status.");
      }
      updates.status = status;
    }

    if (req.body.image_url !== undefined) {
      const image_url =
        typeof req.body.image_url === "string"
          ? req.body.image_url.trim().slice(0, 500)
          : "";

      if (!image_url) {
        throw new ApiError(400, "Invalid image_url.");
      }

      updates.image_url = image_url;
    }

    if (req.body.record_id !== undefined) {
      updates.record_id = req.body.record_id;
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
  validatePagination,
  validateSort,
  validateAnimalFilters,
  validateAnimalsQuery,
  validateAnimalId,
  validateCreateAnimal,
  validateUpdateAnimal
};
