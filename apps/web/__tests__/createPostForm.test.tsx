import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockRouterPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const mockCreatePost = jest.fn();
const mockUpdatePost = jest.fn();
const mockUploadPostImage = jest.fn();
const mockFetchUploadConfig = jest.fn();
const mockIsUploadStorageAvailable = jest.fn();
const mockGetUploadStorageUnavailableMessage = jest.fn();

jest.mock("@/services/postService", () => ({
  createPost: (...args: unknown[]) => mockCreatePost(...args),
  updatePost: (...args: unknown[]) => mockUpdatePost(...args),
  uploadPostImage: (...args: unknown[]) => mockUploadPostImage(...args),
}));

jest.mock("@/services/animalImageUploadService", () => ({
  fetchUploadConfig: (...args: unknown[]) => mockFetchUploadConfig(...args),
  isUploadStorageAvailable: (...args: unknown[]) => mockIsUploadStorageAvailable(...args),
  getUploadStorageUnavailableMessage: (...args: unknown[]) =>
    mockGetUploadStorageUnavailableMessage(...args),
}));

import CreatePostForm from "@/components/Admin/CreatePost/createPostForm";

const HEALTHY_CONFIG = { r2Configured: true, health: { ok: true } };

beforeEach(() => {
  jest.clearAllMocks();
  mockFetchUploadConfig.mockResolvedValue(HEALTHY_CONFIG);
  mockIsUploadStorageAvailable.mockReturnValue(true);
  mockGetUploadStorageUnavailableMessage.mockReturnValue("");
  global.URL.createObjectURL = jest.fn(() => "blob:test");
  global.URL.revokeObjectURL = jest.fn();
});

describe("CreatePostForm", () => {
  it("renders the form heading", () => {
    render(<CreatePostForm />);
    expect(screen.getByRole("heading", { name: /nueva publicación/i })).toBeInTheDocument();
  });

  it("renders back link to /admin/posts", () => {
    render(<CreatePostForm />);
    const link = screen.getByRole("link", { name: /volver/i });
    expect(link).toHaveAttribute("href", "/admin/posts");
  });

  it("shows validation error when submitting empty title", async () => {
    render(<CreatePostForm />);
    const form = screen.getByRole("button", { name: /crear publicación/i }).closest("form")!;
    fireEvent.submit(form);
    await waitFor(() => expect(screen.getByText(/título es requerido/i)).toBeInTheDocument());
  });

  it("shows validation error when body is missing", async () => {
    render(<CreatePostForm />);
    await userEvent.type(screen.getByLabelText(/título/i), "Mi Título");
    const form = screen.getByRole("button", { name: /crear publicación/i }).closest("form")!;
    fireEvent.submit(form);
    await waitFor(() => expect(screen.getByText(/contenido es requerido/i)).toBeInTheDocument());
  });

  it("creates post successfully and shows success message", async () => {
    mockCreatePost.mockResolvedValue({
      pid: 1,
      header: "Test",
      body: "Body",
      is_pinned: false,
      image_url: null,
      created_at: "2026-01-01T00:00:00Z",
    });

    render(<CreatePostForm />);
    await userEvent.type(screen.getByLabelText(/título/i), "Mi Título");
    await userEvent.type(screen.getByLabelText(/contenido/i), "Mi contenido del post");
    const form = screen.getByRole("button", { name: /crear publicación/i }).closest("form")!;
    fireEvent.submit(form);

    await waitFor(() =>
      expect(screen.getByText(/publicación creada exitosamente/i)).toBeInTheDocument()
    );
  });

  it("redirects to /admin/posts after success", async () => {
    mockCreatePost.mockResolvedValue({
      pid: 2,
      header: "T",
      body: "B",
      is_pinned: false,
      image_url: null,
      created_at: "2026-01-01T00:00:00Z",
    });

    render(<CreatePostForm />);
    await userEvent.type(screen.getByLabelText(/título/i), "T");
    await userEvent.type(screen.getByLabelText(/contenido/i), "B");
    const form = screen.getByRole("button", { name: /crear publicación/i }).closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => screen.getByText(/publicación creada exitosamente/i));
    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith("/admin/posts"), {
      timeout: 3000,
    });
  }, 10000);

  it("shows error when createPost throws", async () => {
    mockCreatePost.mockRejectedValue(new Error("Network error"));

    render(<CreatePostForm />);
    await userEvent.type(screen.getByLabelText(/título/i), "T");
    await userEvent.type(screen.getByLabelText(/contenido/i), "B");
    const form = screen.getByRole("button", { name: /crear publicación/i }).closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => expect(screen.getByText(/Network error/i)).toBeInTheDocument());
  });

  it("renders is_pinned checkbox", () => {
    render(<CreatePostForm />);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });
});
