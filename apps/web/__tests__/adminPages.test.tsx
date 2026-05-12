import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import AdminAccessDeniedPage from "@/pages/admin/acessDenied";
import AccessDeniedAliasPage from "@/pages/admin/accessDenied";
import CreateUserPage from "@/pages/admin/createUser";
import NewUserPage from "@/pages/admin/createUser/new";
import AdminLoginPage from "@/pages/admin/login";

const mockUseAuthRequired = jest.fn();
const mockUseAuthRequiredRol = jest.fn();

jest.mock("@/lib/useAuthRequired", () => ({
  useAuthRequired: () => mockUseAuthRequired(),
  useAuthRequiredRol: (...args: unknown[]) => mockUseAuthRequiredRol(...args),
}));

jest.mock("@/components/Admin/AdminHeader/adminHeader", () => {
  function AdminHeaderMock() {
    return <div>AdminHeaderMock</div>;
  }

  AdminHeaderMock.displayName = "AdminHeaderMock";

  return AdminHeaderMock;
});
jest.mock("@/components/Admin/AccessDeniedScreen/accessDenied", () => {
  function AccessDeniedScreenMock() {
    return <div>AccessDeniedScreenMock</div>;
  }

  AccessDeniedScreenMock.displayName = "AccessDeniedScreenMock";

  return AccessDeniedScreenMock;
});
jest.mock("@/components/Admin/UsersManagement/usersManagement", () => {
  function UsersManagementMock() {
    return <div>UsersManagementMock</div>;
  }

  UsersManagementMock.displayName = "UsersManagementMock";

  return UsersManagementMock;
});
jest.mock("@/components/Admin/CreateUser/createUserForm", () => {
  function CreateUserFormMock() {
    return <div>CreateUserFormMock</div>;
  }

  CreateUserFormMock.displayName = "CreateUserFormMock";

  return CreateUserFormMock;
});
jest.mock("@/components/Admin/Login/login", () => {
  function LoginPageMock() {
    return <div>LoginPageMock</div>;
  }

  LoginPageMock.displayName = "LoginPageMock";

  return LoginPageMock;
});

describe("admin page wrappers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthRequired.mockReturnValue({ isLoading: false });
    mockUseAuthRequiredRol.mockReturnValue({ isLoadingRole: false, hasRequiredRole: true });
  });

  it("renders access denied page content after loading", () => {
    render(<AdminAccessDeniedPage />);

    expect(screen.getByText("AdminHeaderMock")).toBeInTheDocument();
    expect(screen.getByText("AccessDeniedScreenMock")).toBeInTheDocument();
  });

  it("renders alias access denied page export", () => {
    render(<AccessDeniedAliasPage />);

    expect(screen.getByText("AccessDeniedScreenMock")).toBeInTheDocument();
  });

  it("renders users management page for authorized admins", () => {
    render(<CreateUserPage />);

    expect(screen.getByText("AdminHeaderMock")).toBeInTheDocument();
    expect(screen.getByText("UsersManagementMock")).toBeInTheDocument();
  });

  it("returns null for unauthorized create user page", () => {
    mockUseAuthRequiredRol.mockReturnValue({ isLoadingRole: false, hasRequiredRole: false });

    const { container } = render(<CreateUserPage />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders new user form page when authorized", () => {
    render(<NewUserPage />);

    expect(screen.getByText("CreateUserFormMock")).toBeInTheDocument();
  });

  it("shows checking permissions state on new user page", () => {
    mockUseAuthRequiredRol.mockReturnValue({ isLoadingRole: true, hasRequiredRole: false });

    render(<NewUserPage />);

    expect(screen.getByText("Checking permissions...")).toBeInTheDocument();
  });

  it("renders login page wrapper", () => {
    render(<AdminLoginPage />);

    expect(screen.getByText("LoginPageMock")).toBeInTheDocument();
  });
});
