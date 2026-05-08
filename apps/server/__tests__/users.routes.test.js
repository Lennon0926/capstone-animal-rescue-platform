const request = require("supertest");

const mockRolesSelect = jest.fn();
const mockRolesIn = jest.fn();
const mockUserRolesSelectIn = jest.fn();
const mockUserRolesDeleteEq = jest.fn();
const mockUserRolesInsert = jest.fn();
const mockAuthGetUser = jest.fn();
const mockAuthAdminCreateUser = jest.fn();
const mockAuthAdminListUsers = jest.fn();
const mockAuthAdminUpdateUserById = jest.fn();
const mockAuthAdminDeleteUser = jest.fn();

const mockFrom = jest.fn((table) => {
  if (table === "roles") {
    return {
      select: jest.fn((columns) => {
        if (columns === "*") {
          return mockRolesSelect();
        }

        if (columns === "id") {
          return { in: mockRolesIn };
        }

        if (columns === "id, name") {
          return { in: mockRolesIn };
        }

        return {};
      }),
    };
  }

  if (table === "user_roles") {
    return {
      select: jest.fn((columns) => {
        if (columns === "user_id, role_id") {
          return { in: mockUserRolesSelectIn };
        }

        return {};
      }),
      delete: jest.fn(() => ({ eq: mockUserRolesDeleteEq })),
      insert: mockUserRolesInsert,
    };
  }

  return {
    select: jest.fn(() => mockRolesSelect()),
  };
});

const mockSupabaseClient = {
  from: mockFrom,
  auth: {
    getUser: mockAuthGetUser,
    admin: {
      createUser: mockAuthAdminCreateUser,
      listUsers: mockAuthAdminListUsers,
      updateUserById: mockAuthAdminUpdateUserById,
      deleteUser: mockAuthAdminDeleteUser,
    },
  },
};

jest.mock("../lib/supabase", () => ({
  getSupabaseClient: () => mockSupabaseClient,
  verifyConnection: () => Promise.resolve({ connected: true }),
}));

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  process.env.PORT = "4000";
});

afterAll(() => {
  console.error.mockRestore();
});

const getApp = () => require("../server");

const asAuthenticated = (req) =>
  req.set("Authorization", "Bearer test-auth-token");

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthGetUser.mockResolvedValue({
    data: { user: { id: "admin-user-id" } },
    error: null,
  });
  mockAuthAdminListUsers.mockResolvedValue({
    data: { users: [] },
    error: null,
  });
});

describe("GET /api/users", () => {
  it("returns users with role names and ids", async () => {
    mockAuthAdminListUsers.mockResolvedValue({
      data: {
        users: [
          {
            id: "user-1",
            email: "jane@example.com",
            user_metadata: { full_name: "Jane Doe" },
            created_at: "2026-01-01T00:00:00Z",
            last_sign_in_at: null,
          },
        ],
      },
      error: null,
    });
    mockUserRolesSelectIn.mockResolvedValue({
      data: [{ user_id: "user-1", role_id: 1 }],
      error: null,
    });
    mockRolesIn.mockResolvedValue({
      data: [{ id: 1, name: "admin" }],
      error: null,
    });

    const res = await asAuthenticated(request(getApp()).get("/api/users"));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "user-1",
          email: "jane@example.com",
          full_name: "Jane Doe",
          role_ids: [1],
          role_names: ["admin"],
        }),
      ]),
    );
  });
});

describe("GET /api/users/roles", () => {
  it("returns available roles", async () => {
    mockRolesSelect.mockResolvedValue({
      data: [
        { id: 1, name: "admin", description: "Admin role" },
        { id: 2, name: "helper", description: "Helper role" },
      ],
      error: null,
    });

    const res = await asAuthenticated(request(getApp()).get("/api/users/roles"));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });

  it("returns 401 without auth token", async () => {
    const res = await request(getApp()).get("/api/users/roles");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe("PATCH /api/users/:userId", () => {
  const VALID_BODY = {
    full_name: "Jane Updated",
    email: "jane.updated@example.com",
    role_ids: [2],
  };

  it("updates user data and roles", async () => {
    mockRolesIn.mockResolvedValue({
      data: [{ id: 2, name: "helper" }],
      error: null,
    });
    mockAuthAdminUpdateUserById.mockResolvedValue({
      data: { user: { id: "user-1", email: "jane.updated@example.com" } },
      error: null,
    });
    mockUserRolesDeleteEq.mockResolvedValue({ error: null });
    mockUserRolesInsert.mockResolvedValue({ error: null });

    const res = await asAuthenticated(
      request(getApp()).patch("/api/users/user-1").send(VALID_BODY),
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      id: "user-1",
      email: "jane.updated@example.com",
      full_name: "Jane Updated",
      role_ids: [2],
      role_names: ["helper"],
    });
  });
});

describe("DELETE /api/users/:userId", () => {
  it("deletes a user by id", async () => {
    mockAuthAdminDeleteUser.mockResolvedValue({ error: null });

    const res = await asAuthenticated(request(getApp()).delete("/api/users/user-1"));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({ id: "user-1" });
    expect(mockAuthAdminDeleteUser).toHaveBeenCalledWith("user-1");
  });
});

describe("POST /api/users", () => {
  const VALID_BODY = {
    full_name: "Jane Doe",
    email: "jane@example.com",
    password: "strong-password",
    role_ids: [1, 2],
  };

  it("creates a user and replaces default roles with requested roles", async () => {
    mockRolesIn.mockResolvedValue({
      data: [{ id: 1 }, { id: 2 }],
      error: null,
    });
    mockAuthAdminCreateUser.mockResolvedValue({
      data: { user: { id: "new-user-id", email: "jane@example.com" } },
      error: null,
    });
    mockUserRolesDeleteEq.mockResolvedValue({ error: null });
    mockUserRolesInsert.mockResolvedValue({ error: null });

    const res = await asAuthenticated(request(getApp()).post("/api/users")).send(
      VALID_BODY,
    );

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      id: "new-user-id",
      email: "jane@example.com",
      full_name: "Jane Doe",
      role_ids: [1, 2],
    });
    expect(mockUserRolesDeleteEq).toHaveBeenCalledWith("user_id", "new-user-id");
    expect(mockUserRolesInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          user_id: "new-user-id",
          role_id: 1,
        }),
      ]),
    );
  });

  it("returns 400 when role_ids is missing", async () => {
    const { role_ids, ...bodyWithoutRoleIds } = VALID_BODY;
    void role_ids;

    const res = await asAuthenticated(request(getApp()).post("/api/users")).send(
      bodyWithoutRoleIds,
    );

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/role_ids/i);
  });

  it("returns 409 when email already exists", async () => {
    mockRolesIn.mockResolvedValue({
      data: [{ id: 1 }, { id: 2 }],
      error: null,
    });
    mockAuthAdminCreateUser.mockResolvedValue({
      data: { user: null },
      error: { message: "User already been registered" },
    });

    const res = await asAuthenticated(request(getApp()).post("/api/users")).send(
      VALID_BODY,
    );

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});
