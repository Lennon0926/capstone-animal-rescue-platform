/* eslint-disable @next/next/no-img-element */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AdminHeader from "@/components/Admin/AdminHeader/adminHeader";
import { signOut } from "@/lib/auth";

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

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

jest.mock("@/lib/auth", () => ({
  signOut: jest.fn(),
}));

const mockedSignOut = signOut as jest.MockedFunction<typeof signOut>;

describe("AdminHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders key navigation links", () => {
    render(<AdminHeader />);

    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Animales" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Usuarios" })).toBeInTheDocument();
  });

  it("opens mobile menu when toggled", async () => {
    const user = userEvent.setup();
    render(<AdminHeader />);

    await user.click(screen.getByRole("button", { name: /toggle menu/i }));

    expect(screen.getAllByRole("link", { name: "Posts" }).length).toBeGreaterThan(1);
  });

  it("logs out and redirects to /home", async () => {
    const user = userEvent.setup();
    mockedSignOut.mockResolvedValue();

    render(<AdminHeader />);

    await user.click(screen.getByRole("button", { name: "Logout" }));

    expect(mockedSignOut).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/home");
  });

  it("handles logout errors without redirecting", async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockedSignOut.mockRejectedValue(new Error("boom"));

    render(<AdminHeader />);

    await user.click(screen.getByRole("button", { name: "Logout" }));

    expect(mockPush).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
