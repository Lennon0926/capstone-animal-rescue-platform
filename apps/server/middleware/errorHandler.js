/**
 * Standardized Error Handler Middleware
 * Provides consistent error responses across all API endpoints.
 */

/**
 * Custom API Error class for controlled error responses.
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

/**
 * Create standardized error response object.
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {*} [details] - Optional additional details
 * @returns {Object} Standardized error response
 */
function createErrorResponse(statusCode, message, details = null) {
  const response = {
    success: false,
    error: {
      code: statusCode,
      message,
    },
  };

  if (details && process.env.NODE_ENV !== "production") {
    response.error.details = details;
  }

  return response;
}

/**
 * Express error handling middleware.
 * Handles both operational errors and unexpected errors.
 */
function errorHandler(err, req, res, next) {
  // Log error for debugging
  console.error(`[ERROR] ${new Date().toISOString()}:`, {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle known API errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json(
      createErrorResponse(err.statusCode, err.message, err.details)
    );
  }

  // Handle Supabase specific errors
  if (err.code && err.code.startsWith("PGRST")) {
    return res.status(400).json(
      createErrorResponse(400, "Database query error", err.message)
    );
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json(
      createErrorResponse(400, "Invalid JSON in request body")
    );
  }

  // Handle unexpected errors (500)
  return res.status(500).json(
    createErrorResponse(500, "Internal server error")
  );
}

/**
 * 404 Not Found handler for undefined routes.
 */
function notFoundHandler(req, res) {
  res.status(404).json(
    createErrorResponse(404, `Route not found: ${req.method} ${req.path}`)
  );
}

/**
 * Async route wrapper to catch errors in async handlers.
 * @param {Function} fn - Async route handler
 * @returns {Function} Wrapped handler
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  ApiError,
  createErrorResponse,
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
