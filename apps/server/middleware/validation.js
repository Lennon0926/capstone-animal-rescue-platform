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

module.exports = {
  sanitizeString,
  validatePagination,
  validateSort,
  validateAnimalFilters,
  validateAnimalsQuery,
  validateAnimalId,
};
