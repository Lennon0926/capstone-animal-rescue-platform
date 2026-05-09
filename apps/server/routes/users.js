const express = require("express");

const { asyncHandler, ApiError } = require("../middleware/errorHandler");
const { requireAuth } = require("../middleware/auth");
const { requireJson } = require("../middleware/requireJson");
const {
  createUserWithRoles,
  getRoles,
  getRoleNamesForUser,
  listUsersWithRoles,
  updateUserWithRoles,
  deleteUserById,
} = require("../repositories/usersRepository");

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

function extractRolesFromAuthenticatedUser(user) {
  const normalizeRoleValue = (value) => {
    if (typeof value !== "string") {
      return [];
    }

    const normalized = value.trim();
    return normalized ? [normalized] : [];
  };

  const collectRoles = (container) => {
    if (!container || typeof container !== "object") {
      return [];
    }

    const roles = [];
    roles.push(...normalizeRoleValue(container.role));

    if (Array.isArray(container.roles)) {
      for (const roleValue of container.roles) {
        roles.push(...normalizeRoleValue(roleValue));
      }
    } else if (typeof container.roles === "string") {
      for (const roleValue of container.roles.split(",")) {
        roles.push(...normalizeRoleValue(roleValue));
      }
    }

    return roles;
  };

  const metadataRoles = [
    ...collectRoles(user?.app_metadata),
    ...collectRoles(user?.user_metadata),
  ];

  return [...new Set(metadataRoles)];
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

function validateUserIdParam(req, res, next) {
  const userId = typeof req.params.userId === "string" ? req.params.userId.trim() : "";

  if (!userId) {
    return next(new ApiError(400, "userId is required."));
  }

  req.validatedParams = {
    userId,
  };

  return next();
}

function validateUpdateUserPayload(req, res, next) {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const fullName =
    typeof req.body.full_name === "string" ? req.body.full_name.trim() : "";

  if (!email) {
    return next(new ApiError(400, "Email is required."));
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
    userId: req.validatedParams.userId,
    email,
    fullName,
    roleIds,
  };

  return next();
}

router.get(
  "/",
  asyncHandler(requireAuth),
  asyncHandler(async (req, res) => {
    const result = await listUsersWithRoles();
    if (result.error) {
      throw new ApiError(500, "Failed to fetch users.", result.error);
    }

    res.json({
      success: true,
      data: result.data,
    });
  }),
);

router.get(
  "/me/roles",
  asyncHandler(requireAuth),
  asyncHandler(async (req, res) => {
    const result = await getRoleNamesForUser(req.authenticatedUser.id);
    if (result.error) {
      throw new ApiError(500, "Failed to fetch current user roles.", result.error);
    }

    res.json({
      success: true,
      data: {
        user_id: req.authenticatedUser.id,
        role_ids: result.data.roleIds,
        role_names: [
          ...new Set([
            ...result.data.roleNames,
            ...extractRolesFromAuthenticatedUser(req.authenticatedUser),
          ]),
        ],
      },
    });
  }),
);

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

router.patch(
  "/:userId",
  requireJson,
  asyncHandler(requireAuth),
  validateUserIdParam,
  validateUpdateUserPayload,
  asyncHandler(async (req, res) => {
    const result = await updateUserWithRoles(req.validatedBody);
    if (result.error) {
      const lowerError = result.error.toLowerCase();

      if (lowerError.includes("already") && lowerError.includes("registered")) {
        throw new ApiError(409, "A user with this email already exists.");
      }

      if (lowerError.includes("not found")) {
        throw new ApiError(404, "User not found.");
      }

      if (lowerError.includes("some roles do not exist")) {
        throw new ApiError(400, result.error);
      }

      throw new ApiError(500, "Failed to update user.", result.error);
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

router.delete(
  "/:userId",
  asyncHandler(requireAuth),
  validateUserIdParam,
  asyncHandler(async (req, res) => {
    const result = await deleteUserById(req.validatedParams.userId);
    if (result.error) {
      const lowerError = result.error.toLowerCase();
      if (lowerError.includes("not found")) {
        throw new ApiError(404, "User not found.");
      }

      throw new ApiError(500, "Failed to delete user.", result.error);
    }

    res.json({
      success: true,
      data: {
        id: req.validatedParams.userId,
      },
    });
  }),
);

module.exports = router;
