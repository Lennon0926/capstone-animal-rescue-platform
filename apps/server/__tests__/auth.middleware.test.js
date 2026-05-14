const mockAuthGetUser = jest.fn();

jest.mock("../lib/supabase", () => ({
  getSupabaseClient: () => ({
    auth: { getUser: mockAuthGetUser },
  }),
}));

const { requireAuth, optionalAuth } = require("../middleware/auth");

function mockRes() {
  const res = { statusCode: 200, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.body = data; return res; };
  return res;
}

function mockReq(authHeader) {
  return { headers: { authorization: authHeader } };
}

beforeEach(() => jest.clearAllMocks());

// ── requireAuth ───────────────────────────────────────────────────────────────

describe("requireAuth", () => {
  it("calls next with 401 ApiError when no Authorization header", async () => {
    const next = jest.fn();
    await requireAuth(mockReq(undefined), mockRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  it("calls next with 401 ApiError when header is not Bearer", async () => {
    const next = jest.fn();
    await requireAuth(mockReq("Basic abc123"), mockRes(), next);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  it("calls next with 401 when token is only whitespace after Bearer", async () => {
    const next = jest.fn();
    await requireAuth(mockReq("Bearer   "), mockRes(), next);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  it("calls next with 401 when supabase returns error", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: new Error("invalid token") });
    const next = jest.fn();
    await requireAuth(mockReq("Bearer bad-token"), mockRes(), next);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  it("calls next with 401 when supabase returns no user", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const next = jest.fn();
    await requireAuth(mockReq("Bearer empty-result"), mockRes(), next);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  it("sets req.authenticatedUser and calls next() when token is valid", async () => {
    const user = { id: "user-abc" };
    mockAuthGetUser.mockResolvedValue({ data: { user }, error: null });
    const next = jest.fn();
    const req = mockReq("Bearer valid-token");
    await requireAuth(req, mockRes(), next);
    expect(req.authenticatedUser).toEqual(user);
    expect(next).toHaveBeenCalledWith(); // no error arg
  });
});

// ── optionalAuth ──────────────────────────────────────────────────────────────

describe("optionalAuth", () => {
  it("calls next without error when no Authorization header", async () => {
    const next = jest.fn();
    const req = mockReq(undefined);
    await optionalAuth(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
    expect(req.authenticatedUser).toBeUndefined();
  });

  it("sets req.authenticatedUser when token is valid", async () => {
    const user = { id: "user-xyz" };
    mockAuthGetUser.mockResolvedValue({ data: { user }, error: null });
    const next = jest.fn();
    const req = mockReq("Bearer good-token");
    await optionalAuth(req, mockRes(), next);
    expect(req.authenticatedUser).toEqual(user);
    expect(next).toHaveBeenCalledWith();
  });

  it("calls next without error when token is invalid (does not block)", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: new Error("bad") });
    const next = jest.fn();
    const req = mockReq("Bearer bad-token");
    await optionalAuth(req, mockRes(), next);
    expect(req.authenticatedUser).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });
});
