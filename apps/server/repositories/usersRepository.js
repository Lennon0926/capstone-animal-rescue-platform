const { getSupabaseClient } = require("../lib/supabase");

function extractRoleName(role) {
  if (!role || typeof role !== "object") {
    return null;
  }

  const id = role.id ?? role.role_id ?? null;
  const directNameCandidates = [role.name, role.role_name, role.Admin, role.admin];
  const directName = directNameCandidates.find(
    (value) => typeof value === "string" && value.trim().length > 0,
  );

  if (directName) {
    return directName.trim();
  }

  const fallbackStringEntry = Object.entries(role).find(([key, value]) => {
    const normalizedKey = String(key).toLowerCase();
    return (
      typeof value === "string" &&
      value.trim().length > 0 &&
      !["id", "role_id", "description", "created_at", "updated_at"].includes(normalizedKey)
    );
  });

  if (fallbackStringEntry) {
    return fallbackStringEntry[1].trim();
  }

  if (typeof id === "number" || typeof id === "string") {
    return String(id);
  }

  return null;
}

function isMissingColumnError(error, columnName) {
  const message = error?.message;
  if (typeof message !== "string") {
    return false;
  }

  const normalizedMessage = message.toLowerCase();
  return normalizedMessage.includes("column") && normalizedMessage.includes(columnName.toLowerCase());
}

async function getUserRoleRowsByColumn({ columnName, userIds }) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("user_roles")
    .select(`${columnName}, role_id`)
    .in(columnName, userIds);

  return { data: data || [], error, columnName };
}

async function getUserRoleRowsByUserIds(userIds) {
  const userIdQueryResult = await getUserRoleRowsByColumn({
    columnName: "user_id",
    userIds,
  });

  if (!userIdQueryResult.error) {
    return userIdQueryResult;
  }

  if (!isMissingColumnError(userIdQueryResult.error, "user_id")) {
    return userIdQueryResult;
  }

  return getUserRoleRowsByColumn({
    columnName: "uid",
    userIds,
  });
}

async function getRoleRowsForUser({ columnName, userId }) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("user_roles")
    .select("role_id")
    .eq(columnName, userId);

  return { data: data || [], error, columnName };
}

async function getRoleRowsForUserById(userId) {
  const userIdQueryResult = await getRoleRowsForUser({
    columnName: "user_id",
    userId,
  });

  if (!userIdQueryResult.error) {
    return userIdQueryResult;
  }

  if (!isMissingColumnError(userIdQueryResult.error, "user_id")) {
    return userIdQueryResult;
  }

  return getRoleRowsForUser({
    columnName: "uid",
    userId,
  });
}

async function replaceUserRoleRows({ columnName, userId, roleIds }) {
  const client = getSupabaseClient();

  const deleteResult = await client.from("user_roles").delete().eq(columnName, userId);
  if (deleteResult.error) {
    return { error: deleteResult.error, columnName };
  }

  const roleRows = roleIds.map((roleId) => ({
    [columnName]: userId,
    role_id: roleId,
  }));

  const insertResult = await client.from("user_roles").insert(roleRows);
  if (insertResult.error) {
    return { error: insertResult.error, columnName };
  }

  return { error: null, columnName };
}

async function getRoles() {
  const client = getSupabaseClient();
  const { data, error } = await client.from("roles").select("*");

  if (error) {
    return { data: [], error: error.message };
  }

  const normalizedRoles = (data || [])
    .map((role) => {
      const id = role.id ?? role.role_id ?? null;
      const name = extractRoleName(role);

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

  let { data, error } = await client
    .from("roles")
    .select("id, name, role_name")
    .in("id", uniqueRoleIds);

  if (
    error &&
    (isMissingColumnError(error, "name") || isMissingColumnError(error, "role_name"))
  ) {
    const fallbackResult = await client.from("roles").select("*").in("id", uniqueRoleIds);
    data = fallbackResult.data;
    error = fallbackResult.error;
  }

  if (error) {
    return { data: null, error: error.message };
  }

  return {
    data: new Map(
      (data || []).map((role) => [
        role.id ?? role.role_id,
        extractRoleName(role) ?? String(role.id ?? role.role_id),
      ]),
    ),
    error: null,
  };
}

async function getUserRolesByUserId(userIds) {
  if (userIds.length === 0) {
    return { data: new Map(), error: null };
  }

  const { data, error, columnName } = await getUserRoleRowsByUserIds(userIds);

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
    const mappedUserId = row[columnName];
    const existingRoles = rolesByUserId.get(mappedUserId) || [];
    existingRoles.push({
      id: row.role_id,
      name: roleNamesByIdResult.data.get(row.role_id) || String(row.role_id),
    });
    rolesByUserId.set(mappedUserId, existingRoles);
  }

  return { data: rolesByUserId, error: null };
}

async function getRoleNamesForUser(userId) {
  const { data, error } = await getRoleRowsForUserById(userId);

  if (error) {
    return { data: { roleIds: [], roleNames: [] }, error: error.message };
  }

  const roleIds = [...new Set((data || []).map((row) => row.role_id).filter(Boolean))];
  if (roleIds.length === 0) {
    return { data: { roleIds: [], roleNames: [] }, error: null };
  }

  const roleNamesByIdResult = await getRoleNamesById(roleIds);
  if (roleNamesByIdResult.error) {
    return { data: { roleIds: [], roleNames: [] }, error: roleNamesByIdResult.error };
  }

  const roleNames = roleIds
    .map((roleId) => roleNamesByIdResult.data.get(roleId) || String(roleId))
    .filter(Boolean);

  return { data: { roleIds, roleNames }, error: null };
}

async function replaceUserRoles({ userId, roleIds }) {
  const userIdReplaceResult = await replaceUserRoleRows({
    columnName: "user_id",
    userId,
    roleIds,
  });

  if (!userIdReplaceResult.error) {
    return { error: null };
  }

  if (!isMissingColumnError(userIdReplaceResult.error, "user_id")) {
    return { error: userIdReplaceResult.error.message };
  }

  const uidReplaceResult = await replaceUserRoleRows({
    columnName: "uid",
    userId,
    roleIds,
  });

  if (uidReplaceResult.error) {
    return { error: uidReplaceResult.error.message };
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
  getRoleNamesForUser,
  createUserWithRoles,
  listUsersWithRoles,
  updateUserWithRoles,
  deleteUserById,
};
