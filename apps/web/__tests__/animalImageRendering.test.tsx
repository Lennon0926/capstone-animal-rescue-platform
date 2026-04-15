import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import type { Animal } from "@/types/animal";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    fill: _fill,
    priority: _priority,
    ...props
  }: {
    src: string | { src: string };
    alt: string;
    fill?: boolean;
    priority?: boolean;
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

describe("animal image rendering", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL = R2_PUBLIC_BASE_URL;
  });

  afterAll(() => {
    delete process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL;
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
});
