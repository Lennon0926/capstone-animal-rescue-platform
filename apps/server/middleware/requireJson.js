const { createErrorResponse } = require("./errorHandler");

function requireJson(req, res, next) {
  if (["POST", "PATCH", "PUT"].includes(req.method) && !req.is("application/json")) {
    return res
      .status(415)
      .json(createErrorResponse(415, "Content-Type must be application/json"));
  }
  next();
}

module.exports = { requireJson };
