const { getSupabaseClient } = require("../lib/supabase");

const client = getSupabaseClient();

async function getSetting(key) {
  const { data, error } = await client.from("settings").select("value").eq("key", key).single();
  if (error) throw error;
  return data?.value ?? null;
}

async function setSetting(key, value) {
  const { data, error } = await client
    .from("settings")
    .upsert({ key, value: value ?? null, updated_at: new Date().toISOString() })
    .select("value")
    .single();
  if (error) throw error;
  return data?.value ?? null;
}

module.exports = { getSetting, setSetting };
