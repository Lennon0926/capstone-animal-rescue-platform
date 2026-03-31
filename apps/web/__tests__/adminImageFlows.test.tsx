/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import CreateAnimalForm from "@/components/Admin/CreateAnimal/createAnimalForm";
import EditAnimalForm from "@/components/Admin/EditAnimal/editAnimalForm";
import AnimalImageUploadForm from "@/components/Animal/animalImageUploadForm";
import type { Animal } from "@/types/animal";
import {
  fetchAnimals,
  fetchUploadConfig,
} from "@/services/animalImageUploadService";

type MockImageProps = {
  alt?: string;
  src?: string | { src?: string };
  fill?: boolean;
} & Record<string, unknown>;

type MockLinkProps = {
  children: ReactNode;
  href: string;
} & Record<string, unknown>;

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt, src, fill, ...props }: MockImageProps) => {
    void fill;

    return (
      <img
        alt={alt}
        src={typeof src === "string" ? src : src?.src || ""}
        {...props}
      />
    );
  },
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: MockLinkProps) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/services/animalImageUploadService", () => {
  const actual = jest.requireActual("@/services/animalImageUploadService");

  return {
    ...actual,
    fetchAnimals: jest.fn(),
    fetchUploadConfig: jest.fn(),
    uploadAnimalImage: jest.fn(),
    updateAnimalImageObjectKey: jest.fn(),
    uploadAndUpdateAnimalImage: jest.fn(),
  };
});

const mockFetchAnimals = fetchAnimals as jest.MockedFunction<typeof fetchAnimals>;
const mockFetchUploadConfig =
  fetchUploadConfig as jest.MockedFunction<typeof fetchUploadConfig>;

const unhealthyUploadConfig = {
  r2Configured: true,
  missingEnvVars: [],
  publicObjectUrlConfigured: true,
  missingPublicObjectUrlEnvVars: [],
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  maxImageSizeBytes: 5 * 1024 * 1024,
  health: {
    ok: false,
    code: "R2_UNAUTHORIZED",
    message: "Cloudflare R2 rejected the configured server credentials.",
    checkedAt: "2026-03-29T12:00:00.000Z",
  },
};

const sampleAnimal: Animal = {
  aid: 7,
  name: "Luna",
  description: "Friendly rescue animal",
  species: "perro",
  size: "mediano",
  gender: "hembra",
  status: "disponible",
  tags: ["juguetona"],
  created_at: "2026-03-01T12:00:00.000Z",
  image_url: null,
  image_object_key: null,
  record_id: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:4000";
  global.fetch = jest.fn();
  URL.createObjectURL = jest.fn(() => "blob:preview");
  URL.revokeObjectURL = jest.fn();
  mockFetchAnimals.mockResolvedValue([sampleAnimal]);
  mockFetchUploadConfig.mockResolvedValue(unhealthyUploadConfig);
});

describe("admin image flow gating", () => {
  it("blocks animal creation before the POST when storage is unhealthy", async () => {
    render(<CreateAnimalForm />);

    await screen.findByText(
      /Cloudflare R2 rechazó las credenciales configuradas en el servidor/i
    );

    fireEvent.change(screen.getByLabelText(/Nombre/i), {
      target: { value: "Luna" },
    });
    fireEvent.change(screen.getByLabelText(/Descripción/i), {
      target: { value: "Friendly rescue animal" },
    });
    fireEvent.change(screen.getByLabelText(/Especie/i), {
      target: { value: "perro" },
    });
    fireEvent.change(screen.getByLabelText(/Tamaño/i), {
      target: { value: "mediano" },
    });
    fireEvent.change(screen.getByLabelText(/Género/i), {
      target: { value: "hembra" },
    });
    fireEvent.change(screen.getByLabelText(/Estado/i), {
      target: { value: "disponible" },
    });

    const imageInput = screen.getByLabelText(/Selecciona una imagen/i);
    fireEvent.change(imageInput, {
      target: {
        files: [new File(["img"], "photo.jpg", { type: "image/jpeg" })],
      },
    });

    fireEvent.submit(
      screen.getByRole("button", { name: /Crear Animal/i }).closest("form")!
    );

    await waitFor(() => {
      expect(mockFetchUploadConfig).toHaveBeenCalledTimes(2);
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("keeps metadata-only edits available when image storage is unhealthy", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            ...sampleAnimal,
            name: "Luna Actualizada",
          },
        }),
    });

    render(<EditAnimalForm animal={sampleAnimal} />);

    const imageInput = await screen.findByLabelText(
      /Selecciona una nueva imagen/i
    );
    expect(imageInput).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Nombre/i), {
      target: { value: "Luna Actualizada" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Guardar Cambios/i })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:4000/api/animals/7",
        expect.objectContaining({
          method: "PATCH",
        })
      );
    });
  });

  it("disables the standalone upload action when storage is unhealthy", async () => {
    render(<AnimalImageUploadForm />);

    const imageInput = await screen.findByLabelText(/Image File/i);
    expect(imageInput).toBeDisabled();

    expect(
      screen.getByRole("button", { name: /Image Storage Unavailable/i })
    ).toBeDisabled();
  });
});
