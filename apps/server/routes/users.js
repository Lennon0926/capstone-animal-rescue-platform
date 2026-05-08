const express = require("express");

const { asyncHandler, ApiError } = require("../middleware/errorHandler");
const { requireAuth } = require("../middleware/auth");
const { requireJson } = require("../middleware/requireJson");
const { createUserWithRoles, getRoles } = require("../repositories/usersRepository");

const router = express.Router();

function parseRoleIds(roleIdsRaw) {
  if (!Array.isArray(roleIdsRaw) || roleIdsRaw.length === 0) {
    throw new ApiError(400, "role_ids must be a non-empty array.");
  }

  const parsedRoleIds = roleIdsRaw.map((roleId) => Number.parseInt(String(roleId), 10));
  if (parsedRoleIds.some((roleId) => !Number.isInteger(roleId) || roleId < 1)) {
    throw new ApiError(400, "role_ids must contain positive integers.");
  }

  return parsedRoleIds;
}

function validateCreateUserPayload(req, res, next) {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";
  const fullName =
    typeof req.body.full_name === "string" ? req.body.full_name.trim() : "";

  if (!email) {
    return next(new ApiError(400, "Email is required."));
  }

  if (!password || password.length < 6) {
    return next(new ApiError(400, "Password must be at least 6 characters."));
  }

  if (!fullName) {
    return next(new ApiError(400, "full_name is required."));
  }

  let roleIds;
  try {
    roleIds = parseRoleIds(req.body.role_ids);
  } catch (error) {
    return next(error);
  }

  req.validatedBody = {
    email,
    password,
    fullName,
    roleIds,
  };

  return next();
}

router.get(
  "/roles",
  asyncHandler(requireAuth),
  asyncHandler(async (req, res) => {
    const result = await getRoles();
    if (result.error) {
      throw new ApiError(500, "Failed to fetch roles.", result.error);
    }

    res.json({
      success: true,
      data: result.data,
    });
  }),
);

router.post(
  "/",
  requireJson,
  asyncHandler(requireAuth),
  validateCreateUserPayload,
  asyncHandler(async (req, res) => {
    const result = await createUserWithRoles(req.validatedBody);

    if (result.error) {
      const lowerError = result.error.toLowerCase();
      if (lowerError.includes("already") && lowerError.includes("registered")) {
        throw new ApiError(409, "A user with this email already exists.");
      }

      if (lowerError.includes("some roles do not exist")) {
        throw new ApiError(400, result.error);
      }

      throw new ApiError(500, "Failed to create user.", result.error);
    }

    res.status(201).json({
      success: true,
      data: result.data,
    });
  }),
);

module.exports = router;
