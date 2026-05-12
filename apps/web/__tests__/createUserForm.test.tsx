import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CreateUserForm from "@/components/Admin/CreateUser/createUserForm";
import { getAuthenticatedHeaders } from "@/lib/apiAuth";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("@/lib/apiAuth", () => ({
  getAuthenticatedHeaders: jest.fn(),
}));

const mockedGetAuthenticatedHeaders = getAuthenticatedHeaders as jest.MockedFunction<
  typeof getAuthenticatedHeaders
>;

describe("CreateUserForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:4000";
    mockedGetAuthenticatedHeaders.mockResolvedValue({ Authorization: "Bearer test-token" });
    global.fetch = jest.fn();
  });

  it("loads role options for the role selector", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          { id: 1, name: "admin" },
          { id: 2, name: "helper" },
        ],
      }),
    });

    render(<CreateUserForm />);

    expect(await screen.findByRole("option", { name: "admin" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "helper" })).toBeInTheDocument();
  });

  it("shows validation error when passwords do not match", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [{ id: 1, name: "admin" }] }),
    });

    render(<CreateUserForm />);

    await screen.findByRole("option", { name: "admin" });

    await user.type(screen.getByLabelText(/full name/i), "Jane Doe");
    await user.type(screen.getByLabelText(/^email/i), "jane@example.com");
    await user.selectOptions(screen.getByLabelText(/role/i), "1");
    await user.type(screen.getByLabelText(/^password/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "different123");

    await user.click(screen.getByRole("button", { name: /create user/i }));

    expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("submits normalized payload and shows success message", async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [{ id: 1, name: "admin" }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: "user-1",
            email: "jane@example.com",
            full_name: "Jane Doe",
            role_ids: [1],
          },
        }),
      });

    render(<CreateUserForm />);

    await screen.findByRole("option", { name: "admin" });

    await user.type(screen.getByLabelText(/full name/i), " Jane Doe ");
    await user.type(screen.getByLabelText(/^email/i), " JANE@EXAMPLE.COM ");
    await user.selectOptions(screen.getByLabelText(/role/i), "1");
    await user.type(screen.getByLabelText(/^password/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");

    await user.click(screen.getByRole("button", { name: /create user/i }));

    await waitFor(() => {
      expect(screen.getByText(/was created with role "admin"/i)).toBeInTheDocument();
    });

    const submitCall = (global.fetch as jest.Mock).mock.calls[1];
    expect(submitCall[0]).toBe("http://localhost:4000/api/users");
    expect(submitCall[1]).toMatchObject({ method: "POST" });
    expect(JSON.parse(submitCall[1].body)).toEqual({
      full_name: "Jane Doe",
      email: "jane@example.com",
      password: "password123",
      role_ids: [1],
    });
  });

  it("shows error when loading roles fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, data: [] }),
    });

    render(<CreateUserForm />);

    expect(await screen.findByText("Failed to load roles.")).toBeInTheDocument();
  });
});
