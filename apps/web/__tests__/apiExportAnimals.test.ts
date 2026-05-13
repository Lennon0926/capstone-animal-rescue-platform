/**
 * Tests for pages/api/export/animals.ts
 */
import type { NextApiRequest, NextApiResponse } from "next";

const mockGetUser = jest.fn();

jest.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
  }),
}));

jest.mock("exceljs", () => {
  const mockWriteBuffer = jest.fn().mockResolvedValue(Buffer.from("xlsx-data"));
  const mockAddRow = jest.fn();
  const mockAddWorksheet = jest.fn(() => ({
    columns: [],
    addRow: mockAddRow,
  }));
  class MockWorkbook {
    addWorksheet = mockAddWorksheet;
    xlsx = { writeBuffer: mockWriteBuffer };
  }
  return {
    __esModule: true,
    default: { Workbook: MockWorkbook },
  };
});

function mockReq(overrides: Partial<NextApiRequest> = {}): NextApiRequest {
  return {
    method: "GET",
    query: {},
    headers: { authorization: "Bearer valid-token" },
    body: undefined,
    ...overrides,
  } as NextApiRequest;
}

function mockRes() {
  const res = {
    _status: 200,
    _body: undefined as unknown,
    _headers: {} as Record<string, string | number | readonly string[]>,
  };
  res.status = function (code: number) { res._status = code; return res; };
  res.json = function (data: unknown) { res._body = data; return res; };
  res.send = function (data: unknown) { res._body = data; return res; };
  res.setHeader = function (name: string, value: string | number | readonly string[]) {
    res._headers[name] = value;
    return res;
  };
  return res;
}

const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    NEXT_PUBLIC_API_BASE_URL: "http://localhost:4000",
  };
  jest.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
});

afterAll(() => {
  process.env = originalEnv;
});

async function loadHandler() {
  const mod = await import("@/pages/api/export/animals");
  return mod.default;
}

describe("pages/api/export/animals", () => {
  it("returns 405 for non-GET methods", async () => {
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq({ method: "POST" }), res as unknown as NextApiResponse);
    expect(res._status).toBe(405);
  });

  it("returns 401 when no Authorization header", async () => {
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq({ headers: {} }), res as unknown as NextApiResponse);
    expect(res._status).toBe(401);
  });

  it("returns 401 when token is invalid", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("invalid") });
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq(), res as unknown as NextApiResponse);
    expect(res._status).toBe(401);
  });

  it("returns 500 when supabase env vars not configured", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    jest.resetModules();
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq(), res as unknown as NextApiResponse);
    expect(res._status).toBe(500);
  });

  it("returns 500 when API base URL not configured", async () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    jest.resetModules();
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq(), res as unknown as NextApiResponse);
    expect(res._status).toBe(500);
  });

  it("returns xlsx buffer on success", async () => {
    const mockAnimals = [
      { aid: 1, name: "Rex", description: "Dog", species: "perro", gender: "macho", size: "mediano", status: "disponible", created_at: "2026-01-01T00:00:00Z", tags: ["amigable"], is_sterilized: true, estimated_age: 2 },
    ];
    const mockRecords = [
      { aid: 1, record_type: "vacunación", date_given: "2026-01-10T00:00:00Z", vet_name: "Dr. Rivera", notes: "Rabies vaccine", created_at: "2026-01-10T00:00:00Z" },
    ];

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockAnimals, pagination: { hasMore: false } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockRecords }),
      });

    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq(), res as unknown as NextApiResponse);

    expect(res._headers["Content-Type"]).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
  });

  it("returns 502 when records fetch fails", async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [], pagination: { hasMore: false } }),
      })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) });

    jest.spyOn(console, "error").mockImplementation(() => {});
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq(), res as unknown as NextApiResponse);
    expect(res._status).toBe(502);
    (console.error as jest.Mock).mockRestore();
  });
});
