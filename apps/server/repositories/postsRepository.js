const { getSupabaseClient } = require("../lib/supabase");
const { getPublicObjectUrl, normalizeObjectKey, deleteObject } = require("../services/r2Service");

const _postsCache = new Map();
const POSTS_TTL_MS = 10_000;
const _postsInFlight = new Map();

function _postsQueryKey(options) {
  return JSON.stringify({
    l: options.limit ?? 50,
    o: options.offset ?? 0,
  });
}

function clearPostsCache() {
  _postsCache.clear();
}

function serializePostRecord(post) {
  if (!post) return post;

  const imageObjectKey = normalizeObjectKey(post.image_object_key);
  const imageUrl = imageObjectKey ? getPublicObjectUrl(imageObjectKey) : null;

  return {
    ...post,
    image_object_key: imageObjectKey,
    image_url: imageUrl,
  };
}

function normalizePostImageFields(postData = {}) {
  const normalized = { ...postData };
  const explicitObjectKey = normalizeObjectKey(postData.image_object_key);

  if (explicitObjectKey) {
    normalized.image_object_key = explicitObjectKey;
    normalized.image_url = getPublicObjectUrl(explicitObjectKey);
    return normalized;
  }

  delete normalized.image_url;
  return normalized;
}

async function getPosts({ limit = 50, offset = 0 } = {}) {
  const cacheKey = _postsQueryKey({ limit, offset });
  const cached = _postsCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < POSTS_TTL_MS) {
    return cached.value;
  }

  if (_postsInFlight.has(cacheKey)) {
    return _postsInFlight.get(cacheKey);
  }

  const dbCall = (async () => {
    try {
      const client = getSupabaseClient();
      const safeLimit = Math.min(Math.max(1, Number.parseInt(limit, 10) || 50), 100);
      const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);

      const { data, error, count } = await client
        .from("posts")
        .select("*", { count: "exact" })
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .range(safeOffset, safeOffset + safeLimit - 1);

      if (error) {
        return { data: [], count: 0, error: error.message };
      }

      const result = {
        data: (data || []).map(serializePostRecord),
        count: count || 0,
        error: null,
      };
      _postsCache.set(cacheKey, { value: result, cachedAt: Date.now() });
      return result;
    } catch (err) {
      return { data: [], count: 0, error: err.message };
    } finally {
      _postsInFlight.delete(cacheKey);
    }
  })();

  _postsInFlight.set(cacheKey, dbCall);
  return dbCall;
}

async function getPostById(pid) {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("posts")
      .select("*")
      .eq("pid", pid)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { data: null, error: "Post not found" };
      }
      return { data: null, error: error.message };
    }

    return { data: serializePostRecord(data), error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

async function createPost(payload) {
  try {
    const client = getSupabaseClient();
    const { is_pinned, ...rest } = payload;

    if (is_pinned) {
      await client.from("posts").update({ is_pinned: false }).eq("is_pinned", true);
    }

    const insertData = normalizePostImageFields({ ...rest, is_pinned: Boolean(is_pinned) });

    const { data, error } = await client
      .from("posts")
      .insert(insertData)
      .select("*")
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    clearPostsCache();
    return { data: serializePostRecord(data), error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

async function updatePostById(pid, updates) {
  try {
    const client = getSupabaseClient();
    const { is_pinned, remove_image, ...rest } = updates;

    if (is_pinned === true) {
      await client.from("posts").update({ is_pinned: false }).eq("is_pinned", true).neq("pid", pid);
    }

    if (remove_image) {
      // Fetch current key before nulling so we can delete from R2
      const { data: current } = await client
        .from("posts")
        .select("image_object_key")
        .eq("pid", pid)
        .single();
      const existingKey = normalizeObjectKey(current?.image_object_key);
      if (existingKey) {
        deleteObject(existingKey).catch((err) =>
          console.error(`[r2] Failed to delete post image ${existingKey}:`, err)
        );
      }
    }

    const baseFields = {
      ...rest,
      ...(is_pinned !== undefined ? { is_pinned: Boolean(is_pinned) } : {}),
    };

    const updateData = remove_image
      ? { ...normalizePostImageFields(baseFields), image_object_key: null, image_url: null }
      : normalizePostImageFields(baseFields);

    const { data, error } = await client
      .from("posts")
      .update(updateData)
      .eq("pid", pid)
      .select("*")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { data: null, error: "Post not found" };
      }
      return { data: null, error: error.message };
    }

    clearPostsCache();
    return { data: serializePostRecord(data), error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

async function deletePost(pid) {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("posts")
      .delete()
      .eq("pid", pid)
      .select("*")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { data: null, error: "Post not found" };
      }
      return { data: null, error: error.message };
    }

    const deletedKey = normalizeObjectKey(data?.image_object_key);
    if (deletedKey) {
      deleteObject(deletedKey).catch((err) =>
        console.error(`[r2] Failed to delete post image ${deletedKey}:`, err)
      );
    }

    clearPostsCache();
    return { data: serializePostRecord(data), error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

module.exports = {
  getPosts,
  getPostById,
  createPost,
  updatePostById,
  deletePost,
  serializePostRecord,
  normalizePostImageFields,
  clearPostsCache,
};
