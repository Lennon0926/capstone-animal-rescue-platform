const { getSupabaseClient } = require("../lib/supabase");
const { ApiError } = require("./errorHandler");

const BEARER_PREFIX = "Bearer ";

function getBearerToken(authorizationHeader) {
  if (typeof authorizationHeader !== "string") {
    return null;
  }

  if (!authorizationHeader.startsWith(BEARER_PREFIX)) {
    return null;
  }

  const token = authorizationHeader.slice(BEARER_PREFIX.length).trim();
  return token.length > 0 ? token : null;
}

async function requireAuth(req, res, next) {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    return next(new ApiError(401, "Authentication required."));
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return next(new ApiError(401, "Invalid or expired authentication token."));
  }

  req.authenticatedUser = data.user;
  return next();
}

async function optionalAuth(req, res, next) {
  const token = getBearerToken(req.headers.authorization);

  if (!token) return next();

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (!error && data?.user) {
    req.authenticatedUser = data.user;
  }

  return next();
}

module.exports = {
  requireAuth,
  optionalAuth,
};
