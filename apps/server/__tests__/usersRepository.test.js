const mockRolesSelectAll = jest.fn();
const mockRolesIdIn = jest.fn();
const mockRolesNamesIn = jest.fn();
const mockUserRolesIn = jest.fn();
const mockUserRolesEq = jest.fn();
const mockUserRolesDeleteEq = jest.fn();
const mockUserRolesInsert = jest.fn();
const mockAuthCreateUser = jest.fn();
const mockAuthListUsers = jest.fn();
const mockAuthUpdateUserById = jest.fn();
const mockAuthDeleteUser = jest.fn();

const mockFrom = jest.fn((table) => {
  if (table === "roles") {
    return {
      select: jest.fn((columns) => {
        if (columns === "*") {
          return mockRolesSelectAll();
        }

        if (columns === "id") {
          return { in: mockRolesIdIn };
        }

        if (columns === "id, name, role_name") {
          return { in: mockRolesNamesIn };
        }

        return {};
      }),
    };
  }

  if (table === "user_roles") {
    return {
      select: jest.fn((columns) => {
        if (columns === "user_id, role_id" || columns === "uid, role_id") {
          return { in: mockUserRolesIn };
        }

        if (columns === "role_id") {
          return { eq: mockUserRolesEq };
        }

        return {};
      }),
      delete: jest.fn(() => ({ eq: mockUserRolesDeleteEq })),
      insert: mockUserRolesInsert,
    };
  }

  return { select: jest.fn() };
});

const mockSupabaseClient = {
  from: mockFrom,
  auth: {
    admin: {
      createUser: mockAuthCreateUser,
      listUsers: mockAuthListUsers,
      updateUserById: mockAuthUpdateUserById,
      deleteUser: mockAuthDeleteUser,
    },
  },
};

jest.mock("../lib/supabase", () => ({
  getSupabaseClient: () => mockSupabaseClient,
}));

const {
  getRoles,
  getRoleNamesForUser,
  createUserWithRoles,
  listUsersWithRoles,
  updateUserWithRoles,
  deleteUserById,
} = require("../repositories/usersRepository");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("usersRepository", () => {
  it("normalizes and sorts roles from flexible schema fields", async () => {
    mockRolesSelectAll.mockResolvedValue({
      data: [
        { id: 2, role_name: "helper", description: "helper role" },
        { id: 1, Admin: "admin" },
      ],
      error: null,
    });

    const result = await getRoles();

    expect(result.error).toBeNull();
    expect(result.data).toEqual([
      { id: 1, name: "admin", description: null },
      { id: 2, name: "helper", description: "helper role" },
    ]);
  });

  it("falls back from user_id to uid when loading current user role rows", async () => {
    mockUserRolesEq
      .mockResolvedValueOnce({
        data: null,
        error: { message: "column user_id does not exist" },
      })
      .mockResolvedValueOnce({
        data: [{ role_id: 3 }],
        error: null,
      });
    mockRolesNamesIn.mockResolvedValue({
      data: [{ id: 3, role_name: "foster" }],
      error: null,
    });

    const result = await getRoleNamesForUser("user-1");

    expect(result.error).toBeNull();
    expect(result.data.roleIds).toEqual([3]);
    expect(result.data.roleNames).toEqual(["foster"]);
    expect(mockUserRolesEq).toHaveBeenNthCalledWith(1, "user_id", "user-1");
    expect(mockUserRolesEq).toHaveBeenNthCalledWith(2, "uid", "user-1");
  });

  it("paginates users and maps role names", async () => {
    const pageOneUsers = Array.from({ length: 200 }, (_, index) => ({
      id: `user-${index + 1}`,
      email: `user${index + 1}@example.com`,
      user_metadata: { full_name: `User ${index + 1}` },
      created_at: "2026-01-01T00:00:00Z",
      last_sign_in_at: null,
    }));

    mockAuthListUsers
      .mockResolvedValueOnce({ data: { users: pageOneUsers }, error: null })
      .mockResolvedValueOnce({
        data: {
          users: [
            {
              id: "user-201",
              email: "user201@example.com",
              user_metadata: { full_name: "User 201" },
              created_at: "2026-01-01T00:00:00Z",
              last_sign_in_at: null,
            },
          ],
        },
        error: null,
      });

    mockUserRolesIn.mockResolvedValue({
      data: [
        { user_id: "user-1", role_id: 1 },
        { user_id: "user-201", role_id: 2 },
      ],
      error: null,
    });

    mockRolesNamesIn.mockResolvedValue({
      data: [
        { id: 1, name: "admin" },
        { id: 2, role_name: "helper" },
      ],
      error: null,
    });

    const result = await listUsersWithRoles();

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(201);
    expect(mockAuthListUsers).toHaveBeenNthCalledWith(1, { page: 1, perPage: 200 });
    expect(mockAuthListUsers).toHaveBeenNthCalledWith(2, { page: 2, perPage: 200 });

    const firstUser = result.data.find((user) => user.id === "user-1");
    const secondPageUser = result.data.find((user) => user.id === "user-201");

    expect(firstUser).toMatchObject({ role_ids: [1], role_names: ["admin"] });
    expect(secondPageUser).toMatchObject({ role_ids: [2], role_names: ["helper"] });
  });

  it("returns an explicit error when Supabase create user has no id", async () => {
    mockRolesIdIn.mockResolvedValue({
      data: [{ id: 1 }],
      error: null,
    });

    mockAuthCreateUser.mockResolvedValue({
      data: { user: { email: "jane@example.com" } },
      error: null,
    });

    const result = await createUserWithRoles({
      email: "jane@example.com",
      password: "password123",
      fullName: "Jane",
      roleIds: [1],
    });

    expect(result.data).toBeNull();
    expect(result.error).toBe("Supabase did not return a user id.");
  });

  it("returns replace role errors during update", async () => {
    mockRolesIdIn.mockResolvedValue({
      data: [{ id: 2 }],
      error: null,
    });

    mockAuthUpdateUserById.mockResolvedValue({
      data: { user: { id: "user-10", email: "new@example.com" } },
      error: null,
    });

    mockUserRolesDeleteEq.mockResolvedValue({ error: null });
    mockUserRolesInsert.mockResolvedValue({
      error: { message: "insert failed" },
    });

    const result = await updateUserWithRoles({
      userId: "user-10",
      email: "new@example.com",
      fullName: "New Name",
      roleIds: [2],
    });

    expect(result.data).toBeNull();
    expect(result.error).toBe("insert failed");
  });

  it("returns delete errors by message", async () => {
    mockAuthDeleteUser.mockResolvedValue({
      error: { message: "user missing" },
    });

    const result = await deleteUserById("missing-user");

    expect(result.error).toBe("user missing");
  });
});
