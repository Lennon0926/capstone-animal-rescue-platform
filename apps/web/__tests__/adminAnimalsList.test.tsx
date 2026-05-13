import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminAnimalsList from "@/components/Admin/AdminAnimalsList/adminAnimalsList";
import type { Animal } from "@/types/animal";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...rest }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...rest} />
  ),
}));

jest.mock("@/utils/animalImages", () => ({
  getAnimalImageUrl: () => "/placeholder.jpg",
}));

jest.mock("@/lib/apiAuth", () => ({
  getAuthenticatedHeaders: async () => ({ Authorization: "Bearer test-token" }),
}));

function makeAnimal(overrides: Partial<Animal> = {}): Animal {
  return {
    aid: overrides.aid ?? 1,
    name: overrides.name ?? "Buddy",
    description: "A good dog",
    species: overrides.species ?? "perro",
    size: overrides.size ?? "mediano",
    gender: overrides.gender ?? "macho",
    status: overrides.status ?? "disponible",
    image_url: null,
    image_object_key: null,
    tags: [],
    created_at: "2026-01-01T00:00:00Z",
    record_id: null,
    ...overrides,
  };
}

function makeAnimals(count: number): Animal[] {
  return Array.from({ length: count }, (_, i) =>
    makeAnimal({ aid: i + 1, name: `Animal ${i + 1}` })
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
  global.URL.createObjectURL = jest.fn(() => "blob:test");
  global.URL.revokeObjectURL = jest.fn();
});

// ── Empty state ───────────────────────────────────────────────────────────────

describe("empty state", () => {
  it("shows empty state when no animals", () => {
    render(<AdminAnimalsList initialAnimals={[]} />);
    expect(screen.getByText(/No se encontraron animales/i)).toBeInTheDocument();
  });
});

// ── List render ───────────────────────────────────────────────────────────────

describe("list render", () => {
  it("renders animal names in the table", () => {
    const animals = [makeAnimal({ name: "Rex" }), makeAnimal({ aid: 2, name: "Luna" })];
    render(<AdminAnimalsList initialAnimals={animals} />);
    expect(screen.getByText("Rex")).toBeInTheDocument();
    expect(screen.getByText("Luna")).toBeInTheDocument();
  });

  it("shows total animal count", () => {
    const animals = makeAnimals(3);
    render(<AdminAnimalsList initialAnimals={animals} />);
    expect(screen.getByText(/Total de animales/i)).toBeInTheDocument();
  });

  it("renders edit link with correct href", () => {
    render(<AdminAnimalsList initialAnimals={[makeAnimal({ aid: 42 })]} />);
    const link = screen.getByRole("link", { name: /editar/i });
    expect(link).toHaveAttribute("href", "/admin/editAnimal?id=42");
  });

  it("renders create new animal link", () => {
    render(<AdminAnimalsList initialAnimals={[makeAnimal()]} />);
    const link = screen.getByRole("link", { name: /crear nuevo animal/i });
    expect(link).toHaveAttribute("href", "/admin/createAnimal");
  });
});

// ── Search ────────────────────────────────────────────────────────────────────

describe("search", () => {
  it("filters animals by name", async () => {
    const animals = [makeAnimal({ name: "Rex" }), makeAnimal({ aid: 2, name: "Luna" })];
    render(<AdminAnimalsList initialAnimals={animals} />);
    const input = screen.getByPlaceholderText(/buscar/i);
    await userEvent.type(input, "Rex");
    expect(screen.getByText("Rex")).toBeInTheDocument();
    expect(screen.queryByText("Luna")).not.toBeInTheDocument();
  });

  it("shows no-match message when search finds nothing", async () => {
    render(<AdminAnimalsList initialAnimals={[makeAnimal({ name: "Rex" })]} />);
    const input = screen.getByPlaceholderText(/buscar/i);
    await userEvent.type(input, "zzznomatch");
    expect(screen.getByText(/No se encontraron animales/i)).toBeInTheDocument();
  });

  it("restores full list when search cleared", async () => {
    const animals = [makeAnimal({ name: "Rex" }), makeAnimal({ aid: 2, name: "Luna" })];
    render(<AdminAnimalsList initialAnimals={animals} />);
    const input = screen.getByPlaceholderText(/buscar/i);
    await userEvent.type(input, "Rex");
    await userEvent.clear(input);
    expect(screen.getByText("Rex")).toBeInTheDocument();
    expect(screen.getByText("Luna")).toBeInTheDocument();
  });
});

// ── Sorting ───────────────────────────────────────────────────────────────────

describe("sorting", () => {
  it("toggles sort direction when clicking the same column twice", async () => {
    const animals = [makeAnimal({ aid: 1, name: "Zorro" }), makeAnimal({ aid: 2, name: "Alpha" })];
    render(<AdminAnimalsList initialAnimals={animals} />);
    const nameHeader = screen.getByRole("columnheader", { name: /nombre/i });
    // First click: ascending → Alpha (A) first
    fireEvent.click(nameHeader);
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows[0]).toHaveTextContent("Alpha");
    // Second click: descending → Zorro (Z) first
    fireEvent.click(nameHeader);
    const rows2 = screen.getAllByRole("row").slice(1);
    expect(rows2[0]).toHaveTextContent("Zorro");
  });
});

// ── Pagination ────────────────────────────────────────────────────────────────

describe("pagination", () => {
  it("shows pagination controls when animals exceed one page", () => {
    render(<AdminAnimalsList initialAnimals={makeAnimals(12)} />);
    expect(screen.getByTitle("Página anterior")).toBeDisabled();
    expect(screen.getByTitle("Página siguiente")).toBeEnabled();
  });

  it("navigates to page 2", async () => {
    render(<AdminAnimalsList initialAnimals={makeAnimals(12)} />);
    fireEvent.click(screen.getByTitle("Página siguiente"));
    // Page info text is split across <strong> elements — match against container
    expect(
      screen.getByText(
        (_, el) => el?.tagName === "SPAN" && /Página\s+2\s+de\s+2/i.test(el.textContent ?? "")
      )
    ).toBeInTheDocument();
  });

  it("disables next button on last page", async () => {
    render(<AdminAnimalsList initialAnimals={makeAnimals(12)} />);
    fireEvent.click(screen.getByTitle("Página siguiente"));
    expect(screen.getByTitle("Página siguiente")).toBeDisabled();
  });

  it("navigates back to page 1", async () => {
    render(<AdminAnimalsList initialAnimals={makeAnimals(12)} />);
    fireEvent.click(screen.getByTitle("Página siguiente"));
    fireEvent.click(screen.getByTitle("Página anterior"));
    expect(
      screen.getByText(
        (_, el) => el?.tagName === "SPAN" && /Página\s+1\s+de\s+2/i.test(el.textContent ?? "")
      )
    ).toBeInTheDocument();
  });
});

// ── Delete modal ──────────────────────────────────────────────────────────────

describe("delete modal", () => {
  it("opens confirmation modal on delete click", async () => {
    render(<AdminAnimalsList initialAnimals={[makeAnimal({ name: "Rex" })]} />);
    fireEvent.click(screen.getByRole("button", { name: /eliminar/i }));
    expect(screen.getByRole("heading", { name: /confirmar eliminación/i })).toBeInTheDocument();
    expect(screen.getByText(/eliminar a/i)).toBeInTheDocument();
  });

  it("closes modal on cancel without removing animal", async () => {
    render(<AdminAnimalsList initialAnimals={[makeAnimal({ name: "Rex" })]} />);
    fireEvent.click(screen.getByRole("button", { name: /eliminar/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(
      screen.queryByRole("heading", { name: /confirmar eliminación/i })
    ).not.toBeInTheDocument();
    expect(screen.getByText("Rex")).toBeInTheDocument();
  });

  it("removes animal from list on successful delete", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });
    render(<AdminAnimalsList initialAnimals={[makeAnimal({ aid: 5, name: "Rex" })]} />);
    // Open modal
    fireEvent.click(screen.getByRole("button", { name: /eliminar/i }));
    const modal = await screen.findByRole("heading", { name: /confirmar eliminación/i });
    expect(modal).toBeInTheDocument();
    // Click confirm inside modal (last "Eliminar" button)
    const allDeleteBtns = screen.getAllByRole("button", { name: /eliminar/i });
    fireEvent.click(allDeleteBtns[allDeleteBtns.length - 1]);
    await waitFor(() => expect(screen.queryByText("Rex")).not.toBeInTheDocument());
  });

  it("shows error when delete fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Server error" }),
    });
    render(<AdminAnimalsList initialAnimals={[makeAnimal({ aid: 5, name: "Rex" })]} />);
    fireEvent.click(screen.getByRole("button", { name: /eliminar/i }));
    await screen.findByRole("heading", { name: /confirmar eliminación/i });
    const allDeleteBtns = screen.getAllByRole("button", { name: /eliminar/i });
    fireEvent.click(allDeleteBtns[allDeleteBtns.length - 1]);
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });
});

// ── Status badge styles ───────────────────────────────────────────────────────

describe("status badge", () => {
  it.each([["disponible"], ["adoptado"], ["pendiente"]])("renders %s status", (status) => {
    render(<AdminAnimalsList initialAnimals={[makeAnimal({ status })]} />);
    const badge = screen.getByText(status.charAt(0).toUpperCase() + status.slice(1));
    expect(badge).toBeInTheDocument();
  });
});
