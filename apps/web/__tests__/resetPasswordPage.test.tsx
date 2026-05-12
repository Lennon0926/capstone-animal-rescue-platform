import "@testing-library/jest-dom";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ResetPasswordPage from "@/pages/admin/reset-password";
import { supabase } from "@/lib/supabase";

const mockPush = jest.fn();

jest.mock("next/router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("@/components/Admin/Login/login.module.css", () => ({}));

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      updateUser: jest.fn(),
    },
  },
}));

const mockedSupabase = supabase as {
  auth: {
    getSession: jest.Mock;
    onAuthStateChange: jest.Mock;
    updateUser: jest.Mock;
  };
};

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockedSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows recovery link error when session is missing", async () => {
    mockedSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
    });

    render(<ResetPasswordPage />);

    expect(
      await screen.findByText(
        "Abre esta página desde el enlace del correo para restablecer contraseña."
      )
    ).toBeInTheDocument();
  });

  it("validates matching passwords", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockedSupabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: "token" } },
    });

    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/nueva contraseña/i), "password123");
    await user.type(screen.getByLabelText(/confirmar contraseña/i), "different123");
    await user.click(screen.getByRole("button", { name: "Actualizar contraseña" }));

    expect(await screen.findByText("Las contraseñas no coinciden.")).toBeInTheDocument();
    expect(mockedSupabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("updates password and redirects to login", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockedSupabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: "token" } },
    });
    mockedSupabase.auth.updateUser.mockResolvedValue({ error: null });

    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/nueva contraseña/i), "password123");
    await user.type(screen.getByLabelText(/confirmar contraseña/i), "password123");
    await user.click(screen.getByRole("button", { name: "Actualizar contraseña" }));

    await waitFor(() => {
      expect(mockedSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: "password123",
      });
    });

    expect(
      await screen.findByText("Contraseña actualizada. Redirigiendo al inicio de sesión...")
    ).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(mockPush).toHaveBeenCalledWith("/admin/login");
  });
});
