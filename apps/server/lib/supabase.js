/**
 * Supabase Client Wrapper
 * Provides a singleton Supabase client for server-side database access.
 */

const { createClient } = require("@supabase/supabase-js");

let supabaseInstance = null;

/**
 * Creates and returns a Supabase client instance.
 * Uses singleton pattern to reuse the connection.
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  // Prefer service role key, fall back to anon key for development
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  const schema = process.env.SUPABASE_SCHEMA || "public";

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) must be set"
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_ANON_KEY) {
    console.warn(
      "Using SUPABASE_ANON_KEY instead of SUPABASE_SERVICE_ROLE_KEY. RLS policies will be enforced."
    );
  }

  supabaseInstance = createClient(supabaseUrl, supabaseKey, {
    db: {
      schema,
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseInstance;
}

// Cache the last connection check for 10 seconds so that concurrent health
// probe requests under load share one DB round-trip instead of each opening
// a new connection and competing with the pool.
let _connectionCache = null;
let _connectionCachedAt = 0;
const CONNECTION_CHECK_TTL_MS = 10_000;

/**
 * Verifies the Supabase connection by performing a simple query.
 * Result is cached for 10 seconds to avoid pool pressure under load.
 * @returns {Promise<{connected: boolean, error?: string}>}
 */
async function verifyConnection() {
  if (_connectionCache && Date.now() - _connectionCachedAt < CONNECTION_CHECK_TTL_MS) {
    return _connectionCache;
  }

  try {
    const client = getSupabaseClient();
    const { error } = await client.from("animals").select("aid").limit(1);

    const result = error
      ? { connected: false, error: error.message }
      : { connected: true };

    _connectionCache = result;
    _connectionCachedAt = Date.now();
    return result;
  } catch (err) {
    return { connected: false, error: err.message };
  }
}

module.exports = {
  getSupabaseClient,
  verifyConnection,
};
