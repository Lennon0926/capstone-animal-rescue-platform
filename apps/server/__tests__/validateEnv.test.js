const originalEnv = { ...process.env };

afterEach(() => {
  // Restore env and modules after each test
  Object.keys(process.env).forEach((k) => delete process.env[k]);
  Object.assign(process.env, originalEnv);
  jest.resetModules();
});

function loadModule() {
  return require("../validateEnv");
}

describe("REQUIRED_ENV_VARS", () => {
  it("exports the required env var names", () => {
    const { REQUIRED_ENV_VARS } = loadModule();
    expect(REQUIRED_ENV_VARS).toContain("SUPABASE_URL");
    expect(REQUIRED_ENV_VARS).toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
});

describe("validateEnv", () => {
  it("does not exit when all required vars are set", () => {
    process.env.SUPABASE_URL = "http://localhost";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "secret";
    process.env.NODE_ENV = "development";

    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});

    const { validateEnv } = loadModule();
    validateEnv();

    expect(mockExit).not.toHaveBeenCalled();
    mockExit.mockRestore();
    console.error.mockRestore();
  });

  it("calls process.exit(1) when a required var is missing", () => {
    delete process.env.SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "secret";

    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});

    const { validateEnv } = loadModule();
    validateEnv();

    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
    console.error.mockRestore();
  });

  it("calls process.exit(1) when both required vars are missing", () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});

    const { validateEnv } = loadModule();
    validateEnv();

    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
    console.error.mockRestore();
  });

  it("exits in production when ALLOWED_ORIGINS is empty", () => {
    process.env.SUPABASE_URL = "http://localhost";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "secret";
    process.env.NODE_ENV = "production";
    process.env.ALLOWED_ORIGINS = "";

    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});

    const { validateEnv } = loadModule();
    validateEnv();

    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
    console.error.mockRestore();
  });

  it("does not exit in production when ALLOWED_ORIGINS is set", () => {
    process.env.SUPABASE_URL = "http://localhost";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "secret";
    process.env.NODE_ENV = "production";
    process.env.ALLOWED_ORIGINS = "https://example.com";

    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});

    const { validateEnv } = loadModule();
    validateEnv();

    expect(mockExit).not.toHaveBeenCalled();
    mockExit.mockRestore();
    console.error.mockRestore();
  });
});
