import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Post } from "@/types/post";

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

const mockUpdatePost = jest.fn();
const mockUploadPostImage = jest.fn();
const mockFetchUploadConfig = jest.fn();
const mockIsUploadStorageAvailable = jest.fn();
const mockGetUploadStorageUnavailableMessage = jest.fn();

jest.mock("@/services/postService", () => ({
  updatePost: (...args: unknown[]) => mockUpdatePost(...args),
  uploadPostImage: (...args: unknown[]) => mockUploadPostImage(...args),
}));

jest.mock("@/services/animalImageUploadService", () => ({
  fetchUploadConfig: (...args: unknown[]) => mockFetchUploadConfig(...args),
  isUploadStorageAvailable: (...args: unknown[]) => mockIsUploadStorageAvailable(...args),
  getUploadStorageUnavailableMessage: (...args: unknown[]) =>
    mockGetUploadStorageUnavailableMessage(...args),
}));

import EditPostForm from "@/components/Admin/EditPost/editPostForm";

const MOCK_POST: Post = {
  pid: 5,
  header: "Original Title",
  body: "Original body content",
  is_pinned: false,
  image_url: null,
  image_object_key: null,
  created_at: "2026-01-01T00:00:00Z",
};

const HEALTHY_CONFIG = { r2Configured: true, health: { ok: true } };

beforeEach(() => {
  jest.clearAllMocks();
  mockFetchUploadConfig.mockResolvedValue(HEALTHY_CONFIG);
  mockIsUploadStorageAvailable.mockReturnValue(true);
  mockGetUploadStorageUnavailableMessage.mockReturnValue("");
  global.URL.createObjectURL = jest.fn(() => "blob:test");
  global.URL.revokeObjectURL = jest.fn();
});

describe("EditPostForm — error states", () => {
  it("shows error message when error prop provided", () => {
    render(<EditPostForm error="Post could not be loaded" />);
    expect(screen.getByText(/Post could not be loaded/i)).toBeInTheDocument();
  });

  it("shows not found message when notFound prop is true", () => {
    render(<EditPostForm notFound />);
    expect(screen.getByText(/no.*encontr|not found/i)).toBeInTheDocument();
  });
});

describe("EditPostForm — with post", () => {
  it("pre-populates title field with post header", async () => {
    render(<EditPostForm post={MOCK_POST} />);
    await waitFor(() => {
      const input = screen.getByLabelText(/título/i);
      expect(input).toHaveValue("Original Title");
    });
  });

  it("pre-populates body field", async () => {
    render(<EditPostForm post={MOCK_POST} />);
    await waitFor(() => {
      const textarea = screen.getByLabelText(/contenido/i);
      expect(textarea).toHaveValue("Original body content");
    });
  });

  it("renders back link to /admin/posts", () => {
    render(<EditPostForm post={MOCK_POST} />);
    const link = screen.getByRole("link", { name: /volver/i });
    expect(link).toHaveAttribute("href", "/admin/posts");
  });

  it("shows validation error when title is cleared and form submitted", async () => {
    render(<EditPostForm post={MOCK_POST} />);
    const titleInput = screen.getByLabelText(/título/i);
    await userEvent.clear(titleInput);
    const form = screen.getByRole("button", { name: /guardar cambios/i }).closest("form")!;
    fireEvent.submit(form);
    await waitFor(() => expect(screen.getByText(/título es requerido/i)).toBeInTheDocument());
  });

  it("shows validation error when body is cleared", async () => {
    render(<EditPostForm post={MOCK_POST} />);
    const bodyInput = screen.getByLabelText(/contenido/i);
    await userEvent.clear(bodyInput);
    const form = screen.getByRole("button", { name: /guardar cambios/i }).closest("form")!;
    fireEvent.submit(form);
    await waitFor(() => expect(screen.getByText(/contenido es requerido/i)).toBeInTheDocument());
  });

  it("calls updatePost and shows success message on valid submit", async () => {
    mockUpdatePost.mockResolvedValue(undefined);

    render(<EditPostForm post={MOCK_POST} />);
    const titleInput = screen.getByLabelText(/título/i);
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Updated Title");

    const form = screen.getByRole("button", { name: /guardar cambios/i }).closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => expect(screen.getByText(/publicación actualizada/i)).toBeInTheDocument());
    expect(mockUpdatePost).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ header: "Updated Title" })
    );
  });

  it("redirects to /admin/posts after successful update", async () => {
    mockUpdatePost.mockResolvedValue(undefined);

    render(<EditPostForm post={MOCK_POST} />);
    const form = screen.getByRole("button", { name: /guardar cambios/i }).closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => screen.getByText(/publicación actualizada/i));
    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith("/admin/posts"), {
      timeout: 3000,
    });
  }, 10000);

  it("shows error message when updatePost throws", async () => {
    mockUpdatePost.mockRejectedValue(new Error("Update failed"));

    render(<EditPostForm post={MOCK_POST} />);
    const form = screen.getByRole("button", { name: /guardar cambios/i }).closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => expect(screen.getByText(/Update failed/i)).toBeInTheDocument());
  });

  it("updates is_pinned when checkbox toggled", async () => {
    render(<EditPostForm post={MOCK_POST} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});
