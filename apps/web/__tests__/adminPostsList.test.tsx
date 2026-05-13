import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminPostsList from "@/components/Admin/AdminPostsList/adminPostsList";
import type { Post } from "@/types/post";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const mockDeletePost = jest.fn();
jest.mock("@/services/postService", () => ({
  deletePost: (...args: unknown[]) => mockDeletePost(...args),
}));

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    pid: overrides.pid ?? 1,
    header: overrides.header ?? "Test Post",
    body: "Body content",
    is_pinned: overrides.is_pinned ?? false,
    image_url: overrides.image_url ?? null,
    image_object_key: null,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makePosts(count: number): Post[] {
  return Array.from({ length: count }, (_, i) =>
    makePost({ pid: i + 1, header: `Post ${i + 1}` })
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Empty state ───────────────────────────────────────────────────────────────

describe("empty state", () => {
  it("shows empty state with create link when no posts", () => {
    render(<AdminPostsList initialPosts={[]} />);
    expect(screen.getByText(/No se encontraron publicaciones/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /crear primera publicación/i })).toBeInTheDocument();
  });
});

// ── List render ───────────────────────────────────────────────────────────────

describe("list render", () => {
  it("renders post headers in the table", () => {
    const posts = [makePost({ header: "Noticia importante" }), makePost({ pid: 2, header: "Evento especial" })];
    render(<AdminPostsList initialPosts={posts} />);
    expect(screen.getByText("Noticia importante")).toBeInTheDocument();
    expect(screen.getByText("Evento especial")).toBeInTheDocument();
  });

  it("shows total post count", () => {
    render(<AdminPostsList initialPosts={makePosts(3)} />);
    expect(screen.getByText(/Total:/i)).toBeInTheDocument();
  });

  it("renders edit link with correct href", () => {
    render(<AdminPostsList initialPosts={[makePost({ pid: 7 })]} />);
    const link = screen.getByRole("link", { name: /editar/i });
    expect(link).toHaveAttribute("href", "/admin/editPost?id=7");
  });

  it("renders nueva publicación link", () => {
    render(<AdminPostsList initialPosts={[makePost()]} />);
    expect(screen.getByRole("link", { name: /nueva publicación/i })).toBeInTheDocument();
  });

  it("renders pin icon for pinned posts", () => {
    render(<AdminPostsList initialPosts={[makePost({ is_pinned: true })]} />);
    expect(screen.getByTitle(/publicación destacada/i)).toBeInTheDocument();
  });

  it("renders image thumbnail when post has image", () => {
    render(<AdminPostsList initialPosts={[makePost({ image_url: "https://example.com/img.jpg", header: "With Image" })]} />);
    expect(screen.getByRole("img", { name: "With Image" })).toBeInTheDocument();
  });
});

// ── Search ────────────────────────────────────────────────────────────────────

describe("search", () => {
  it("filters posts by header", async () => {
    const posts = [makePost({ header: "Adopción exitosa" }), makePost({ pid: 2, header: "Evento fin de año" })];
    render(<AdminPostsList initialPosts={posts} />);
    const input = screen.getByPlaceholderText(/buscar/i);
    await userEvent.type(input, "Adopción");
    expect(screen.getByText("Adopción exitosa")).toBeInTheDocument();
    expect(screen.queryByText("Evento fin de año")).not.toBeInTheDocument();
  });

  it("shows no results message when search matches nothing", async () => {
    render(<AdminPostsList initialPosts={[makePost({ header: "Unique title" })]} />);
    const input = screen.getByPlaceholderText(/buscar/i);
    await userEvent.type(input, "zzznomatch");
    expect(screen.getByText(/No hay resultados/i)).toBeInTheDocument();
  });

  it("resets to page 1 when searching", async () => {
    render(<AdminPostsList initialPosts={makePosts(12)} />);
    // Go to page 2
    const nextBtn = screen.getByRole("button", { name: /siguiente/i });
    fireEvent.click(nextBtn);
    // Search
    const input = screen.getByPlaceholderText(/buscar/i);
    await userEvent.type(input, "Post 1");
    // Should show results (not page 2 empty state)
    expect(screen.getByText("Post 1")).toBeInTheDocument();
  });
});

// ── Sorting ───────────────────────────────────────────────────────────────────

describe("sorting", () => {
  it("sorts by header when clicking Título column", () => {
    const posts = [
      makePost({ pid: 1, header: "Zebra post" }),
      makePost({ pid: 2, header: "Alpha post" }),
    ];
    render(<AdminPostsList initialPosts={posts} />);
    const headerCol = screen.getByRole("columnheader", { name: /título/i });
    // First click: ascending (a→z) — Alpha first
    fireEvent.click(headerCol);
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows[0]).toHaveTextContent("Alpha post");
    // Second click: descending (z→a) — Zebra first
    fireEvent.click(headerCol);
    const rows2 = screen.getAllByRole("row").slice(1);
    expect(rows2[0]).toHaveTextContent("Zebra post");
  });
});

// ── Pagination ────────────────────────────────────────────────────────────────

describe("pagination", () => {
  it("shows pagination when posts exceed one page", () => {
    render(<AdminPostsList initialPosts={makePosts(12)} />);
    expect(screen.getByRole("button", { name: /anterior/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /siguiente/i })).toBeEnabled();
  });

  it("navigates to page 2 and back", () => {
    render(<AdminPostsList initialPosts={makePosts(12)} />);
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
    expect(
      screen.getByText((_, el) => el?.tagName === "SPAN" && /Página\s+2\s+de\s+2/i.test(el.textContent ?? ""))
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /anterior/i }));
    expect(
      screen.getByText((_, el) => el?.tagName === "SPAN" && /Página\s+1\s+de\s+2/i.test(el.textContent ?? ""))
    ).toBeInTheDocument();
  });
});

// ── Delete modal ──────────────────────────────────────────────────────────────

describe("delete modal", () => {
  it("opens confirmation modal on delete click", () => {
    render(<AdminPostsList initialPosts={[makePost({ header: "Mi post" })]} />);
    fireEvent.click(screen.getByRole("button", { name: /eliminar/i }));
    expect(screen.getByRole("heading", { name: /confirmar eliminación/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Mi post/).length).toBeGreaterThan(0);
  });

  it("cancels delete without removing post", () => {
    render(<AdminPostsList initialPosts={[makePost({ header: "Mi post" })]} />);
    fireEvent.click(screen.getByRole("button", { name: /eliminar/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(screen.queryByRole("heading", { name: /confirmar eliminación/i })).not.toBeInTheDocument();
    expect(screen.getByText("Mi post")).toBeInTheDocument();
  });

  it("removes post from list on successful delete", async () => {
    mockDeletePost.mockResolvedValue(undefined);
    render(<AdminPostsList initialPosts={[makePost({ pid: 10, header: "Mi post" })]} />);
    fireEvent.click(screen.getByRole("button", { name: /eliminar/i }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /confirmar eliminación/i })).toBeInTheDocument()
    );
    const allDeleteBtns = screen.getAllByRole("button", { name: /eliminar/i });
    fireEvent.click(allDeleteBtns[allDeleteBtns.length - 1]);
    await waitFor(() =>
      expect(screen.queryByText("Mi post")).not.toBeInTheDocument()
    );
  });

  it("shows error message when delete fails", async () => {
    mockDeletePost.mockRejectedValue(new Error("Delete failed"));
    render(<AdminPostsList initialPosts={[makePost({ pid: 10, header: "Mi post" })]} />);
    fireEvent.click(screen.getByRole("button", { name: /eliminar/i }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /confirmar eliminación/i })).toBeInTheDocument()
    );
    const allDeleteBtns = screen.getAllByRole("button", { name: /eliminar/i });
    fireEvent.click(allDeleteBtns[allDeleteBtns.length - 1]);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toBeInTheDocument()
    );
  });
});
