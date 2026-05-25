import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import HeroMatchCard from "@/components/AIPetMatch/heroMatchCard";
import type { PetMatch } from "@/components/AIPetMatch/matchResultCard";
import type { RequestedFields } from "@/components/AIPetMatch/aiPetMatch";
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
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock("@/utils/animalImages", () => ({
  getAnimalImageUrl: () => "/placeholder.jpg",
}));

function makeAnimal(overrides: Partial<Animal> = {}): Animal {
  return {
    aid: 5,
    name: "Luna",
    description: "A calm cat",
    species: "gato",
    size: "pequeño",
    gender: "hembra",
    status: "disponible",
    image_url: null,
    image_object_key: null,
    tags: [],
    created_at: "2026-01-01T00:00:00Z",
    record_id: null,
    ...overrides,
  };
}

function makeMatch(
  animalOverrides: Partial<Animal> = {},
  matchOverrides: Partial<PetMatch> = {}
): PetMatch {
  return {
    animal: makeAnimal(animalOverrides),
    score: 0.9,
    matchedAttributes: ["Gato", "Pequeño"],
    componentScores: { species: 1, size: 1, gender: 0.5, embedding: 0.6 },
    ...matchOverrides,
  };
}

const NO_FIELDS: RequestedFields = { species: false, size: false, gender: false };
const ALL_FIELDS: RequestedFields = { species: true, size: true, gender: true };

describe("HeroMatchCard", () => {
  it("renders the animal name", () => {
    render(<HeroMatchCard match={makeMatch()} requestedFields={NO_FIELDS} />);
    expect(screen.getByRole("heading", { name: "Luna" })).toBeInTheDocument();
  });

  it("renders the subline with species, size, gender", () => {
    render(<HeroMatchCard match={makeMatch()} requestedFields={NO_FIELDS} />);
    expect(screen.getByText("Gato · Pequeño · Hembra")).toBeInTheDocument();
  });

  it("renders the score gauge with correct aria-label", () => {
    render(<HeroMatchCard match={makeMatch()} requestedFields={NO_FIELDS} />);
    expect(screen.getByLabelText("Compatibilidad 90%")).toBeInTheDocument();
  });

  it("renders 0% for score of 0", () => {
    render(<HeroMatchCard match={makeMatch({}, { score: 0 })} requestedFields={NO_FIELDS} />);
    expect(screen.getByLabelText("Compatibilidad 0%")).toBeInTheDocument();
  });

  it("renders matched attribute chips", () => {
    render(<HeroMatchCard match={makeMatch()} requestedFields={NO_FIELDS} />);
    expect(screen.getByText("Gato")).toBeInTheDocument();
    expect(screen.getByText("Pequeño")).toBeInTheDocument();
  });

  it("shows no attribute chips when matchedAttributes is empty", () => {
    const match = makeMatch({}, { matchedAttributes: [] });
    render(<HeroMatchCard match={match} requestedFields={NO_FIELDS} />);
    expect(screen.queryByLabelText("Razones del match")).not.toBeInTheDocument();
  });

  it("renders compatibility bars only for requested fields", () => {
    render(
      <HeroMatchCard
        match={makeMatch()}
        requestedFields={{ species: true, size: false, gender: false }}
      />
    );
    expect(screen.getByRole("progressbar", { name: "Especie" })).toBeInTheDocument();
    expect(screen.queryByRole("progressbar", { name: "Tamaño" })).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar", { name: "Género" })).not.toBeInTheDocument();
  });

  it("renders all compatibility bars when all fields are requested", () => {
    render(<HeroMatchCard match={makeMatch()} requestedFields={ALL_FIELDS} />);
    expect(screen.getByRole("progressbar", { name: "Especie" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Tamaño" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Género" })).toBeInTheDocument();
  });

  it("renders embedding bar when animal has tags", () => {
    const match = makeMatch({ tags: ["tranquilo", "juguetón"] });
    render(<HeroMatchCard match={match} requestedFields={NO_FIELDS} />);
    expect(screen.getByRole("progressbar", { name: "Etiquetas" })).toBeInTheDocument();
  });

  it("does not render embedding bar when animal has no tags", () => {
    const match = makeMatch({ tags: [] });
    render(<HeroMatchCard match={match} requestedFields={ALL_FIELDS} />);
    expect(screen.queryByRole("progressbar", { name: "Etiquetas" })).not.toBeInTheDocument();
  });

  it("renders no bars when componentScores is undefined", () => {
    const match = makeMatch({}, { componentScores: undefined });
    render(<HeroMatchCard match={match} requestedFields={ALL_FIELDS} />);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("renders 'Conocer a [name]' CTA linking to adopt page", () => {
    render(<HeroMatchCard match={makeMatch({ aid: 5 })} requestedFields={NO_FIELDS} />);
    const link = screen.getByRole("link", { name: "Conocer a Luna" });
    expect(link).toHaveAttribute("href", "/adopt/5");
  });

  it("renders 'Iniciar Adopción' CTA linking to adopt page with fragment", () => {
    render(<HeroMatchCard match={makeMatch({ aid: 5 })} requestedFields={NO_FIELDS} />);
    const link = screen.getByRole("link", { name: "Iniciar Adopción" });
    expect(link).toHaveAttribute("href", "/adopt/5#adoptar");
  });

  it("renders the animal image", () => {
    render(<HeroMatchCard match={makeMatch()} requestedFields={NO_FIELDS} />);
    expect(screen.getByAltText("Luna")).toBeInTheDocument();
  });
});
