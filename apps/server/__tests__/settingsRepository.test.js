const mockSingle = jest.fn();
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockEq = jest.fn(() => ({ single: mockSingle }));
const mockUpsert = jest.fn(() => ({ select: mockUpsertSelect }));
const mockUpsertSelect = jest.fn(() => ({ single: mockUpsertSingle }));
const mockUpsertSingle = jest.fn();
const mockFrom = jest.fn((table) => {
  if (table === "settings") {
    return { select: mockSelect, upsert: mockUpsert };
  }
  return {};
});

jest.mock("../lib/supabase", () => ({
  getSupabaseClient: () => ({ from: mockFrom }),
}));

let getSetting, setSetting;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  ({ getSetting, setSetting } = require("../repositories/settingsRepository"));
});

describe("getSetting", () => {
  it("returns the value when row exists", async () => {
    mockSingle.mockResolvedValue({ data: { value: "12345" }, error: null });
    const result = await getSetting("pinned_fb_post_id");
    expect(result).toBe("12345");
    expect(mockFrom).toHaveBeenCalledWith("settings");
    expect(mockEq).toHaveBeenCalledWith("key", "pinned_fb_post_id");
  });

  it("returns null when row not found (PGRST116)", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: "PGRST116" } });
    const result = await getSetting("missing_key");
    expect(result).toBeNull();
  });

  it("returns null when data.value is null", async () => {
    mockSingle.mockResolvedValue({ data: { value: null }, error: null });
    const result = await getSetting("pinned_fb_post_id");
    expect(result).toBeNull();
  });

  it("throws when a real DB error occurs", async () => {
    const dbError = { code: "500", message: "DB failure" };
    mockSingle.mockResolvedValue({ data: null, error: dbError });
    await expect(getSetting("pinned_fb_post_id")).rejects.toEqual(dbError);
  });
});

describe("setSetting", () => {
  it("upserts and returns the new value", async () => {
    mockUpsertSingle.mockResolvedValue({ data: { value: "99" }, error: null });
    const result = await setSetting("pinned_fb_post_id", "99");
    expect(result).toBe("99");
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ key: "pinned_fb_post_id", value: "99" })
    );
  });

  it("coerces null value to null in upsert", async () => {
    mockUpsertSingle.mockResolvedValue({ data: { value: null }, error: null });
    const result = await setSetting("pinned_fb_post_id", null);
    expect(result).toBeNull();
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ key: "pinned_fb_post_id", value: null })
    );
  });

  it("throws when upsert returns an error", async () => {
    const dbError = { message: "upsert failed" };
    mockUpsertSingle.mockResolvedValue({ data: null, error: dbError });
    await expect(setSetting("pinned_fb_post_id", "x")).rejects.toEqual(dbError);
  });
});
