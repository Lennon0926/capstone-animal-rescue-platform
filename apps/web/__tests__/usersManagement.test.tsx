import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import UsersManagement from "@/components/Admin/UsersManagement/usersManagement";
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

const USERS_RESPONSE = {
  success: true,
  data: [
    {
      id: "user-1",
      email: "jane@example.com",
      full_name: "Jane Doe",
      role_ids: [1],
      role_names: ["admin"],
    },
  ],
};

const ROLES_RESPONSE = {
  success: true,
  data: [
    { id: 1, name: "admin" },
    { id: 2, name: "helper" },
  ],
};

describe("UsersManagement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:4000";
    mockedGetAuthenticatedHeaders.mockResolvedValue({ Authorization: "Bearer test-token" });
    global.fetch = jest.fn();
    window.confirm = jest.fn();
  });

  it("loads and renders users from the API", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => USERS_RESPONSE,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ROLES_RESPONSE,
      });

    render(<UsersManagement />);

    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();
  });

  it("edits a user and sends normalized PATCH payload", async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => USERS_RESPONSE,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ROLES_RESPONSE,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: "user-1",
            email: "new.email@example.com",
            full_name: "Jane Updated",
            role_ids: [2],
            role_names: ["helper"],
          },
        }),
      });

    render(<UsersManagement />);

    await screen.findByText("Jane Doe");
    await user.click(screen.getByRole("button", { name: "Edit" }));

    const fullNameInput = screen.getByDisplayValue("Jane Doe");
    const emailInput = screen.getByDisplayValue("jane@example.com");
    const roleSelect = screen.getByDisplayValue("admin");

    await user.clear(fullNameInput);
    await user.type(fullNameInput, "Jane Updated");
    await user.clear(emailInput);
    await user.type(emailInput, " NEW.EMAIL@EXAMPLE.COM ");
    await user.selectOptions(roleSelect, "2");

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText('User "Jane Updated" was updated.')).toBeInTheDocument();
    });

    const patchCall = (global.fetch as jest.Mock).mock.calls.find(
      ([, options]) => options?.method === "PATCH",
    );

    expect(patchCall).toBeDefined();
    expect(patchCall?.[0]).toBe("http://localhost:4000/api/users/user-1");
    expect(JSON.parse(patchCall?.[1].body)).toEqual({
      full_name: "Jane Updated",
      email: "new.email@example.com",
      role_ids: [2],
    });
  });

  it("does not delete when confirmation is canceled", async () => {
    const user = userEvent.setup();
    (window.confirm as jest.Mock).mockReturnValue(false);

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => USERS_RESPONSE,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ROLES_RESPONSE,
      });

    render(<UsersManagement />);

    await screen.findByText("Jane Doe");
    await user.click(screen.getByRole("button", { name: "Delete" }));

    const deleteCall = (global.fetch as jest.Mock).mock.calls.find(
      ([, options]) => options?.method === "DELETE",
    );

    expect(deleteCall).toBeUndefined();
  });

  it("deletes user after confirmation", async () => {
    const user = userEvent.setup();
    (window.confirm as jest.Mock).mockReturnValue(true);

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => USERS_RESPONSE,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ROLES_RESPONSE,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: "user-1" } }),
      });

    render(<UsersManagement />);

    await screen.findByText("Jane Doe");
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(screen.getByText('User "Jane Doe" was deleted.')).toBeInTheDocument();
    });

    expect(screen.queryByText("Jane Doe")).not.toBeInTheDocument();
  });
});
