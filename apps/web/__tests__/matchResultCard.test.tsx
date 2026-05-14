import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import MatchResultCard, { type PetMatch } from "@/components/AIPetMatch/matchResultCard";
import type { Animal } from "@/types/animal";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...rest }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...rest} />
  ),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

jest.mock("@/utils/animalImages", () => ({
  getAnimalImageUrl: () => "/placeholder.jpg",
}));

function makeAnimal(overrides: Partial<Animal> = {}): Animal {
  return {
    aid: 1,
    name: "Buddy",
    description: "A good dog",
    species: "perro",
    size: "mediano",
    gender: "macho",
    status: "disponible",
    image_url: null,
    image_object_key: null,
    tags: [],
    created_at: "2026-01-01T00:00:00Z",
    record_id: null,
    ...overrides,
  };
}

function makeMatch(overrides: Partial<PetMatch> = {}): PetMatch {
  return {
    animal: makeAnimal(),
    score: 0.85,
    matchedAttributes: ["Perro", "Mediano"],
    ...overrides,
  };
}

describe("MatchResultCard", () => {
  it("renders the animal name", () => {
    render(<MatchResultCard match={makeMatch()} />);
    expect(screen.getByText("Buddy")).toBeInTheDocument();
  });

  it("renders the score badge with correct aria-label", () => {
    render(<MatchResultCard match={makeMatch({ score: 0.85 })} />);
    expect(
      screen.getByLabelText("Compatibilidad 85%"),
    ).toBeInTheDocument();
  });

  it("renders 0% for score of 0", () => {
    render(<MatchResultCard match={makeMatch({ score: 0 })} />);
    expect(screen.getByLabelText("Compatibilidad 0%")).toBeInTheDocument();
  });

  it("clamps score above 1 to 100%", () => {
    render(<MatchResultCard match={makeMatch({ score: 1.5 })} />);
    expect(screen.getByLabelText("Compatibilidad 100%")).toBeInTheDocument();
  });

  it("renders subline with size and gender", () => {
    render(<MatchResultCard match={makeMatch()} />);
    expect(screen.getByText("Mediano · Macho")).toBeInTheDocument();
  });

  it("renders matched attribute chips (up to 3)", () => {
    const match = makeMatch({
      matchedAttributes: ["Chip1", "Chip2", "Chip3", "Chip4"],
    });
    render(<MatchResultCard match={match} />);
    expect(screen.getByText("Chip1")).toBeInTheDocument();
    expect(screen.getByText("Chip3")).toBeInTheDocument();
    expect(screen.queryByText("Chip4")).not.toBeInTheDocument();
  });

  it("shows no chips when matchedAttributes is empty", () => {
    const match = makeMatch({ matchedAttributes: [] });
    render(<MatchResultCard match={match} />);
    expect(screen.queryByLabelText("Razones del match")).not.toBeInTheDocument();
  });

  it("renders a 'Ver perfil' link to the animal's adopt page", () => {
    render(<MatchResultCard match={makeMatch({ animal: makeAnimal({ aid: 7 }) })} />);
    const link = screen.getByRole("link", { name: "Ver perfil" });
    expect(link).toHaveAttribute("href", "/adopt/7");
  });

  it("renders the animal image with the animal name as alt text", () => {
    render(<MatchResultCard match={makeMatch()} />);
    expect(screen.getByAltText("Buddy")).toBeInTheDocument();
  });
});
