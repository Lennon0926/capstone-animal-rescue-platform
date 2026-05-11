/* eslint-disable @next/next/no-img-element */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import type { Animal } from "@/types/animal";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string | { src: string };
    alt: string;
    [key: string]: unknown;
  }) => (
    <img
      src={typeof src === "string" ? src : src.src}
      alt={alt}
      {...props}
    />
  ),
}));


jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: {
    href: string | { pathname?: string };
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={typeof href === "string" ? href : href.pathname ?? ""} {...props}>
      {children}
    </a>
  ),
}));

const R2_PUBLIC_BASE_URL =
  "https://pub-9bda3c8e4200423ca4ec2b9ee4d6d5d3.r2.dev";

const animalWithObjectKey: Animal = {
  aid: 42,
  name: "Luna",
  description: "Lista para encontrar un hogar.",
  species: "dog",
  size: "medium",
  gender: "female",
  status: "disponible",
  image_url: "",
  image_object_key: "/animals/42/luna photo.jpg",
  tags: ["friendly"],
  created_at: "2024-01-01T00:00:00.000Z",
  record_id: null,
};

const animalWithMedicalRecords: Animal = {
  ...animalWithObjectKey,
  medical_records: [
    {
      record_id: 5,
      aid: 42,
      record_type: "vacunación",
      date_given: "2026-04-14T10:00:00.000Z",
      vet_name: "Dr. Rivera",
      notes: "Vacuna al día.",
      created_at: "2026-04-14T10:00:00.000Z",
    },
  ],
};

describe("animal image rendering", () => {
  const originalShowAdoptPage = process.env.NEXT_PUBLIC_SHOW_ADOPT_PAGE;

  beforeEach(() => {
    jest.resetModules();
    process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL = R2_PUBLIC_BASE_URL;
    process.env.NEXT_PUBLIC_SHOW_ADOPT_PAGE = "true";
  });

  afterAll(() => {
    delete process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL;

    if (originalShowAdoptPage === undefined) {
      delete process.env.NEXT_PUBLIC_SHOW_ADOPT_PAGE;
    } else {
      process.env.NEXT_PUBLIC_SHOW_ADOPT_PAGE = originalShowAdoptPage;
    }
  });

  it("renders the landing-page animal card image from image_object_key", async () => {
    const { default: AnimalsSection } = await import(
      "@/components/LandingPage/Animals/animalsSection"
    );

    render(<AnimalsSection animals={[animalWithObjectKey]} />);

    expect(screen.getByRole("img", { name: animalWithObjectKey.name })).toHaveAttribute(
      "src",
      `${R2_PUBLIC_BASE_URL}/animals/42/luna%20photo.jpg`,
    );
  });

  it("hides the landing-page animals section when adopt catalog is disabled", async () => {
    process.env.NEXT_PUBLIC_SHOW_ADOPT_PAGE = "false";

    const { default: AnimalsSection } = await import(
      "@/components/LandingPage/Animals/animalsSection"
    );

    render(<AnimalsSection animals={[animalWithObjectKey]} />);

    expect(
      screen.queryByRole("heading", { name: /Conoce a Nuestros Animales/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: animalWithObjectKey.name })).not.toBeInTheDocument();
  });

  it("renders the animal detail image from image_object_key", async () => {
    const { default: AnimalInfo } = await import(
      "@/components/Animal/AnimalInfoPage/animalInfo"
    );

    render(<AnimalInfo animal={animalWithObjectKey} />);

    expect(screen.getByRole("img", { name: animalWithObjectKey.name })).toHaveAttribute(
      "src",
      `${R2_PUBLIC_BASE_URL}/animals/42/luna%20photo.jpg`,
    );
  });

  it("renders medical records on the animal detail page", async () => {
    const { default: AnimalInfo } = await import(
      "@/components/Animal/AnimalInfoPage/animalInfo"
    );

    render(<AnimalInfo animal={animalWithMedicalRecords} />);

    expect(screen.getByRole("heading", { name: /Registros médicos/i })).toBeInTheDocument();
    expect(screen.getByText("Vacunación")).toBeInTheDocument();
    expect(screen.getByText(/Veterinario: Dr\. Rivera/i)).toBeInTheDocument();
    const description = screen.getByText("Vacuna al día.");
    expect(description).toBeInTheDocument();
    expect(description.closest("p")).toHaveTextContent(/Descripción:\s*Vacuna al día\./i);
  });
});
