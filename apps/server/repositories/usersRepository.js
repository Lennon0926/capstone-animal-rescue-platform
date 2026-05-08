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

async function getRoleNamesById(roleIds) {
  const client = getSupabaseClient();
  const uniqueRoleIds = [...new Set(roleIds)];
  if (uniqueRoleIds.length === 0) {
    return { data: new Map(), error: null };
  }

  const { data, error } = await client
    .from("roles")
    .select("id, name")
    .in("id", uniqueRoleIds);

  if (error) {
    return { data: null, error: error.message };
  }

  return {
    data: new Map((data || []).map((role) => [role.id, role.name])),
    error: null,
  };
}

async function getUserRolesByUserId(userIds) {
  const client = getSupabaseClient();
  if (userIds.length === 0) {
    return { data: new Map(), error: null };
  }

  const { data, error } = await client
    .from("user_roles")
    .select("user_id, role_id")
    .in("user_id", userIds);

  if (error) {
    return { data: null, error: error.message };
  }

  const roleIds = [...new Set((data || []).map((row) => row.role_id))];
  const roleNamesByIdResult = await getRoleNamesById(roleIds);
  if (roleNamesByIdResult.error) {
    return { data: null, error: roleNamesByIdResult.error };
  }

  const rolesByUserId = new Map();
  for (const userId of userIds) {
    rolesByUserId.set(userId, []);
  }

  for (const row of data || []) {
    const existingRoles = rolesByUserId.get(row.user_id) || [];
    existingRoles.push({
      id: row.role_id,
      name: roleNamesByIdResult.data.get(row.role_id) || String(row.role_id),
    });
    rolesByUserId.set(row.user_id, existingRoles);
  }

  return { data: rolesByUserId, error: null };
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

async function listUsersWithRoles() {
  const client = getSupabaseClient();
  const perPage = 200;
  let page = 1;
  const users = [];

  while (true) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage });
    if (error) {
      return { data: [], error: error.message };
    }

    const pageUsers = data?.users || [];
    users.push(...pageUsers);

    if (pageUsers.length < perPage) {
      break;
    }

    page += 1;
  }

  const userIds = users.map((user) => user.id).filter(Boolean);
  const userRolesResult = await getUserRolesByUserId(userIds);
  if (userRolesResult.error) {
    return { data: [], error: userRolesResult.error };
  }

  const normalizedUsers = users
    .map((user) => {
      const fullNameValue = user.user_metadata?.full_name;
      const fullName =
        typeof fullNameValue === "string" && fullNameValue.trim()
          ? fullNameValue.trim()
          : "";

      const roles = userRolesResult.data.get(user.id) || [];
      return {
        id: user.id,
        email: user.email || "",
        full_name: fullName,
        role_ids: roles.map((role) => role.id),
        role_names: roles.map((role) => role.name),
        created_at: user.created_at || null,
        last_sign_in_at: user.last_sign_in_at || null,
      };
    })
    .sort((a, b) =>
      `${a.full_name} ${a.email}`.localeCompare(`${b.full_name} ${b.email}`),
    );

  return {
    data: normalizedUsers,
    error: null,
  };
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

async function updateUserWithRoles({ userId, email, fullName, roleIds }) {
  const resolvedRolesResult = await resolveRoleIds(roleIds);
  if (resolvedRolesResult.error) {
    return { data: null, error: resolvedRolesResult.error };
  }

  const client = getSupabaseClient();
  const updateUserResult = await client.auth.admin.updateUserById(userId, {
    email,
    user_metadata: {
      full_name: fullName,
    },
  });

  if (updateUserResult.error) {
    return { data: null, error: updateUserResult.error.message };
  }

  const replaceRolesResult = await replaceUserRoles({
    userId,
    roleIds: resolvedRolesResult.data,
  });
  if (replaceRolesResult.error) {
    return { data: null, error: replaceRolesResult.error };
  }

  const roleNamesByIdResult = await getRoleNamesById(resolvedRolesResult.data);
  if (roleNamesByIdResult.error) {
    return { data: null, error: roleNamesByIdResult.error };
  }

  return {
    data: {
      id: userId,
      email: updateUserResult.data.user?.email || email,
      full_name: fullName,
      role_ids: resolvedRolesResult.data,
      role_names: resolvedRolesResult.data.map(
        (roleId) => roleNamesByIdResult.data.get(roleId) || String(roleId),
      ),
    },
    error: null,
  };
}

async function deleteUserById(userId) {
  const client = getSupabaseClient();
  const { error } = await client.auth.admin.deleteUser(userId);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

module.exports = {
  getRoles,
  createUserWithRoles,
  listUsersWithRoles,
  updateUserWithRoles,
  deleteUserById,
};
