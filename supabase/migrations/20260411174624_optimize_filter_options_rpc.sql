-- Migration: optimize_filter_options_rpc
--
-- Problem: GET /api/animals/filters fires 4 parallel Supabase queries
-- (species, status, size, gender) on every request, each doing a full
-- sequential scan of the animals table. Under 50 VU this generates
-- ~200 redundant DB round-trips per second.
--
-- Fix: single stable RPC that returns all four filter option arrays in one
-- query. The app layer calls supabase.rpc('get_animal_filter_options') and
-- caches the result for 30 seconds, reducing 4 DB calls per request to
-- effectively zero under sustained load.

CREATE OR REPLACE FUNCTION get_animal_filter_options()
RETURNS json
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT json_build_object(
    'species', COALESCE(
      (SELECT json_agg(v ORDER BY v)
         FROM (SELECT DISTINCT species AS v FROM animals WHERE species IS NOT NULL) s),
      '[]'::json
    ),
    'status', COALESCE(
      (SELECT json_agg(v ORDER BY v)
         FROM (SELECT DISTINCT status AS v FROM animals WHERE status IS NOT NULL) s),
      '[]'::json
    ),
    'size', COALESCE(
      (SELECT json_agg(v ORDER BY v)
         FROM (SELECT DISTINCT size AS v FROM animals WHERE size IS NOT NULL) s),
      '[]'::json
    ),
    'gender', COALESCE(
      (SELECT json_agg(v ORDER BY v)
         FROM (SELECT DISTINCT gender AS v FROM animals WHERE gender IS NOT NULL) s),
      '[]'::json
    )
  )
$$;

-- Grant execute to the roles used by the Supabase JS client
GRANT EXECUTE ON FUNCTION get_animal_filter_options() TO anon, authenticated, service_role;
