const { getSupabaseClient } = require("../lib/supabase");

async function getRoles() {
  const client = getSupabaseClient();
  const { data, error } = await client.from("roles").select("*");

  if (error) {
    return { data: [], error: error.message };
  }

  const normalizedRoles = (data || [])
    .map((role) => {
      const id = role.id ?? role.role_id ?? null;
      const name =
        role.name ??
        role.role_name ??
        (typeof id === "number" || typeof id === "string" ? String(id) : null);

      if (!id || !name) {
        return null;
      }

      return {
        id,
        name,
        description: role.description ?? null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));

  return { data: normalizedRoles, error: null };
}

async function createAuthUser({ email, password, fullName }) {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
  });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data?.user || null, error: null };
}

async function resolveRoleIds(roleIds) {
  const client = getSupabaseClient();
  const uniqueRoleIds = [...new Set(roleIds)];
  const { data, error } = await client
    .from("roles")
    .select("id")
    .in("id", uniqueRoleIds);

  if (error) {
    return { data: null, error: error.message };
  }

  const existingRoleIds = new Set((data || []).map((role) => role.id));
  const missingRoleIds = uniqueRoleIds.filter((id) => !existingRoleIds.has(id));

  if (missingRoleIds.length > 0) {
    return {
      data: null,
      error: `Some roles do not exist: ${missingRoleIds.join(", ")}`,
    };
  }

  return { data: uniqueRoleIds, error: null };
}

async function replaceUserRoles({ userId, roleIds }) {
  const client = getSupabaseClient();

  const deleteResult = await client.from("user_roles").delete().eq("user_id", userId);
  if (deleteResult.error) {
    return { error: deleteResult.error.message };
  }

  const roleRows = roleIds.map((roleId) => ({
    user_id: userId,
    role_id: roleId,
  }));

  const insertResult = await client.from("user_roles").insert(roleRows);
  if (insertResult.error) {
    return { error: insertResult.error.message };
  }

  return { error: null };
}

async function createUserWithRoles({ email, password, fullName, roleIds }) {
  const resolvedRolesResult = await resolveRoleIds(roleIds);
  if (resolvedRolesResult.error) {
    return { data: null, error: resolvedRolesResult.error };
  }

  const createAuthUserResult = await createAuthUser({ email, password, fullName });
  if (createAuthUserResult.error) {
    return { data: null, error: createAuthUserResult.error };
  }

  const createdUser = createAuthUserResult.data;
  if (!createdUser?.id) {
    return { data: null, error: "Supabase did not return a user id." };
  }

  const replaceRolesResult = await replaceUserRoles({
    userId: createdUser.id,
    roleIds: resolvedRolesResult.data,
  });

  if (replaceRolesResult.error) {
    return { data: null, error: replaceRolesResult.error };
  }

  return {
    data: {
      id: createdUser.id,
      email: createdUser.email,
      full_name: fullName,
      role_ids: resolvedRolesResult.data,
    },
    error: null,
  };
}

module.exports = {
  getRoles,
  createUserWithRoles,
};
