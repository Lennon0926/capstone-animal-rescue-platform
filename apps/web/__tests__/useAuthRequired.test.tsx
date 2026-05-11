import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";

import { useAuthRequired, useAuthRequiredRol } from "@/lib/useAuthRequired";
import { getAuthenticatedHeaders } from "@/lib/apiAuth";
import { supabase } from "@/lib/supabase";

const mockPush = jest.fn();

jest.mock("next/router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/lib/apiAuth", () => ({
  getAuthenticatedHeaders: jest.fn(),
}));

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}));

const mockedSupabase = supabase as {
  auth: {
    getSession: jest.Mock;
    onAuthStateChange: jest.Mock;
  };
};

const mockedGetAuthenticatedHeaders = getAuthenticatedHeaders as jest.MockedFunction<
  typeof getAuthenticatedHeaders
>;

function AuthProbe() {
  const { isLoading, user } = useAuthRequired();

  return <div>{`${isLoading ? "loading" : "ready"}:${user?.id ?? "none"}`}</div>;
}

function RoleProbe({ requiredRole }: { requiredRole: string }) {
  const { isLoadingRole, user, hasRequiredRole } = useAuthRequiredRol(requiredRole);

  return (
    <div>{`${isLoadingRole ? "loading" : "ready"}:${user?.id ?? "none"}:${hasRequiredRole}`}</div>
  );
}

describe("useAuthRequired hooks", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalBypassEnv = process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = "development";
    process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH = "false";

    mockedSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalBypassEnv === undefined) {
      delete process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH;
    } else {
      process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH = originalBypassEnv;
    }
  });

  it("redirects to login when no session exists", async () => {
    mockedSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    render(<AuthProbe />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/admin/login");
    });
  });

  it("resolves authenticated user when session exists", async () => {
    mockedSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: { user: { id: "admin-1" }, access_token: "token" },
      },
      error: null,
    });

    render(<AuthProbe />);

    expect(await screen.findByText("ready:admin-1")).toBeInTheDocument();
  });

  it("uses bypass mode in test environment", async () => {
    process.env.NODE_ENV = "test";
    mockedSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    render(<AuthProbe />);

    expect(await screen.findByText("ready:none")).toBeInTheDocument();
    expect(mockedSupabase.auth.getSession).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("grants admin role only when role id 1 is present", async () => {
    mockedSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: { user: { id: "admin-1" }, access_token: "token" },
      },
      error: null,
    });

    mockedGetAuthenticatedHeaders.mockResolvedValue({ Authorization: "Bearer token" });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          user_id: "admin-1",
          role_ids: [1],
          role_names: ["admin"],
        },
      }),
    }) as jest.Mock;

    render(<RoleProbe requiredRole="Administrador" />);

    expect(await screen.findByText("ready:admin-1:true")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalledWith("/admin/accessDenied");
  });

  it("redirects to access denied on role response mismatch", async () => {
    mockedSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: { user: { id: "admin-1" }, access_token: "token" },
      },
      error: null,
    });

    mockedGetAuthenticatedHeaders.mockResolvedValue({ Authorization: "Bearer token" });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          user_id: "other-user",
          role_ids: [1],
          role_names: ["admin"],
        },
      }),
    }) as jest.Mock;

    render(<RoleProbe requiredRole="Administrador" />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/admin/accessDenied");
    });
  });
});
