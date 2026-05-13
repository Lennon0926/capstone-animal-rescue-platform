import "@testing-library/jest-dom";
import { fireEvent } from "@testing-library/react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import LoginPage from "@/components/Admin/Login/login";
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

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      resetPasswordForEmail: jest.fn(),
    },
  },
}));

const mockedSupabase = supabase as {
  auth: {
    signInWithPassword: jest.Mock;
    resetPasswordForEmail: jest.Mock;
  };
};

describe("LoginPage", () => {
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  afterAll(() => {
    if (originalAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    }

    if (originalSiteUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    }
  });

  it("validates required login fields", async () => {
    render(<LoginPage />);

    fireEvent.submit(screen.getByRole("button", { name: "Sign In" }).closest("form")!);

    expect(await screen.findByText("Please enter both email and password")).toBeInTheDocument();
  });

  it("maps invalid credentials error", async () => {
    const user = userEvent.setup();
    mockedSupabase.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: "Invalid login credentials" },
    });

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "admin@example.com");
    await user.type(screen.getByLabelText(/contraseña/i), "password123");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(
      await screen.findByText("Invalid email or password. Please try again.")
    ).toBeInTheDocument();
  });

  it("normalizes credentials and redirects on successful login", async () => {
    const user = userEvent.setup();
    mockedSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { session: { access_token: "token" } },
      error: null,
    });

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), " ADMIN@EXAMPLE.COM ");
    await user.type(screen.getByLabelText(/contraseña/i), "password123");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/admin/home");
    });

    expect(mockedSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "admin@example.com",
      password: "password123",
    });
  });

  it("requires email before requesting password reset", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: "¿Olvidaste tu contraseña?" }));

    expect(
      await screen.findByText(
        "Primero ingresa tu correo para recibir el enlace de restablecimiento."
      )
    ).toBeInTheDocument();
  });

  it("sends password reset request and shows success message", async () => {
    const user = userEvent.setup();
    mockedSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });
    process.env.NEXT_PUBLIC_APP_URL = "https://capstone-animal-rescue-web.vercel.app";

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), " Admin@Example.com ");
    await user.click(screen.getByRole("button", { name: "¿Olvidaste tu contraseña?" }));

    await waitFor(() => {
      expect(mockedSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith("admin@example.com", {
        redirectTo: "https://capstone-animal-rescue-web.vercel.app/admin/reset-password",
      });
    });

    expect(
      await screen.findByText("Enlace de restablecimiento enviado. Revisa tu correo.")
    ).toBeInTheDocument();
  });
});
