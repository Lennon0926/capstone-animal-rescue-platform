const {
  ApiError,
  createErrorResponse,
  errorHandler,
  notFoundHandler,
  asyncHandler,
} = require("../middleware/errorHandler");

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(data) {
      res.body = data;
      return res;
    },
  };
  return res;
}

function mockReq(overrides = {}) {
  return { path: "/test", method: "GET", ...overrides };
}

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("ApiError", () => {
  it("creates an operational error with status code and details", () => {
    const err = new ApiError(422, "Validation failed", { field: "name" });
    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(422);
    expect(err.message).toBe("Validation failed");
    expect(err.details).toEqual({ field: "name" });
    expect(err.isOperational).toBe(true);
  });
});

describe("createErrorResponse", () => {
  it("builds a standard error response shape", () => {
    const resp = createErrorResponse(400, "Bad request");
    expect(resp).toEqual({
      success: false,
      error: { code: 400, message: "Bad request" },
    });
  });

  it("includes details when not in production", () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";
    const resp = createErrorResponse(500, "Oops", "extra info");
    expect(resp.error.details).toBe("extra info");
    process.env.NODE_ENV = original;
  });

  it("omits details in production", () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const resp = createErrorResponse(500, "Oops", "extra info");
    expect(resp.error.details).toBeUndefined();
    process.env.NODE_ENV = original;
  });
});

describe("errorHandler middleware", () => {
  it("handles ApiError with correct status", () => {
    const err = new ApiError(404, "Not found");
    const res = mockRes();
    errorHandler(err, mockReq(), res, jest.fn());
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("handles Supabase PGRST errors as 400", () => {
    const err = new Error("query error");
    err.code = "PGRST001";
    const res = mockRes();
    errorHandler(err, mockReq(), res, jest.fn());
    expect(res.statusCode).toBe(400);
  });

  it("handles JSON syntax errors as 400", () => {
    const err = new SyntaxError("Unexpected token");
    err.status = 400;
    err.body = "bad";
    const res = mockRes();
    errorHandler(err, mockReq(), res, jest.fn());
    expect(res.statusCode).toBe(400);
    expect(res.body.error.message).toMatch(/invalid json/i);
  });

  it("handles unknown errors as 500", () => {
    const err = new Error("something unexpected");
    const res = mockRes();
    errorHandler(err, mockReq(), res, jest.fn());
    expect(res.statusCode).toBe(500);
    expect(res.body.error.message).toBe("Internal server error");
  });
});

describe("notFoundHandler", () => {
  it("responds with 404 and route info", () => {
    const res = mockRes();
    notFoundHandler(mockReq({ method: "POST", path: "/api/foo" }), res);
    expect(res.statusCode).toBe(404);
    expect(res.body.error.message).toMatch(/POST \/api\/foo/);
  });
});

describe("asyncHandler", () => {
  it("catches rejected promises and passes to next", async () => {
    const next = jest.fn();
    const handler = asyncHandler(async () => {
      throw new Error("async boom");
    });
    await handler({}, {}, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe("async boom");
  });

  it("calls the handler normally on success", async () => {
    const res = mockRes();
    const handler = asyncHandler(async (req, r) => {
      r.status(200).json({ ok: true });
    });
    await handler({}, res, jest.fn());
    expect(res.body).toEqual({ ok: true });
  });
});
