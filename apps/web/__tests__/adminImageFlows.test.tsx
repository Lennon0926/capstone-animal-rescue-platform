/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import CreateAnimalForm from "@/components/Admin/CreateAnimal/createAnimalForm";
import EditAnimalForm from "@/components/Admin/EditAnimal/editAnimalForm";
import AnimalImageUploadForm from "@/components/Animal/animalImageUploadForm";
import type { Animal } from "@/types/animal";
import {
  fetchAnimals,
  fetchUploadConfig,
  updateAnimalImageObjectKey,
  uploadAnimalImage,
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
const mockUploadAnimalImage =
  uploadAnimalImage as jest.MockedFunction<typeof uploadAnimalImage>;
const mockUpdateAnimalImageObjectKey =
  updateAnimalImageObjectKey as jest.MockedFunction<
    typeof updateAnimalImageObjectKey
  >;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MEDICAL_RECORD_CREATE_FAILED_CODE = "MEDICAL_RECORD_CREATE_FAILED";

const healthyUploadConfig = {
  r2Configured: true,
  missingEnvVars: [],
  publicObjectUrlConfigured: true,
  missingPublicObjectUrlEnvVars: [],
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  maxImageSizeBytes: MAX_IMAGE_SIZE_BYTES,
  health: {
    ok: true,
    code: "OK",
    message: "Mock upload storage is healthy.",
    checkedAt: "2026-03-29T12:00:00.000Z",
  },
};

const unhealthyUploadConfig = {
  r2Configured: true,
  missingEnvVars: [],
  publicObjectUrlConfigured: true,
  missingPublicObjectUrlEnvVars: [],
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  maxImageSizeBytes: MAX_IMAGE_SIZE_BYTES,
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

const sampleAnimalWithMedicalRecords: Animal = {
  ...sampleAnimal,
  medical_records: [
    {
      record_id: 31,
      aid: 7,
      record_type: "vacunación",
      date_given: "2026-04-14T10:00:00.000Z",
      vet_name: "Dr. Rivera",
      notes: "Primary vaccine",
      created_at: "2026-04-14T10:00:00.000Z",
    },
  ],
};

const legacyEnglishAnimalWithMedicalRecords: Animal = {
  ...sampleAnimalWithMedicalRecords,
  species: "dog",
  size: "medium",
  gender: "male",
  status: "available",
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

function fillRequiredCreateAnimalFields() {
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
  fireEvent.change(screen.getByLabelText(/Selecciona una imagen/i), {
    target: {
      files: [new File(["img"], "photo.jpg", { type: "image/jpeg" })],
    },
  });
}

function fillMedicalRecordFields(
  index: number,
  fields: Partial<MedicalRecordFormFields>
) {
  if (fields.record_type !== undefined) {
    fireEvent.change(screen.getAllByLabelText(/Tipo de registro/i)[index], {
      target: { value: fields.record_type },
    });
  }

  if (fields.date_given !== undefined) {
    fireEvent.change(screen.getAllByLabelText(/Fecha del registro/i)[index], {
      target: { value: fields.date_given },
    });
  }

  if (fields.vet_name !== undefined) {
    fireEvent.change(screen.getAllByLabelText(/Veterinario/i)[index], {
      target: { value: fields.vet_name },
    });
  }

  if (fields.notes !== undefined) {
    fireEvent.change(screen.getAllByLabelText(/Notas/i)[index], {
      target: { value: fields.notes },
    });
  }
}

type MedicalRecordFormFields = {
  record_type: string;
  date_given: string;
  vet_name: string;
  notes: string;
};

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
    expect((imageInput as HTMLInputElement).disabled).toBe(true);

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

  it("normalizes legacy English enum values and submits editable medical records in the edit form", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            ...sampleAnimalWithMedicalRecords,
            medical_records: [
              {
                record_id: 31,
                aid: 7,
                record_type: "vacunación",
                date_given: "2026-04-14T10:00:00.000Z",
                vet_name: "Dr. Rivera",
                notes: "Updated vaccine note",
              },
              {
                record_id: 32,
                aid: 7,
                record_type: "examen",
                notes: "New exam note",
              },
            ],
          },
        }),
    });

    render(<EditAnimalForm animal={legacyEnglishAnimalWithMedicalRecords} />);

    expect(screen.getByDisplayValue("Primary vaccine")).toBeTruthy();
    expect((screen.getByLabelText(/Especie/i) as HTMLSelectElement).value).toBe("perro");
    expect((screen.getByLabelText(/Tamaño/i) as HTMLSelectElement).value).toBe("mediano");
    expect((screen.getByLabelText(/Género/i) as HTMLSelectElement).value).toBe("macho");
    expect((screen.getByLabelText(/Estado/i) as HTMLSelectElement).value).toBe(
      "disponible"
    );

    fillMedicalRecordFields(0, {
      notes: "Updated vaccine note",
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Agregar otro registro médico/i })
    );
    fillMedicalRecordFields(1, {
      record_type: "examen",
      notes: "New exam note",
    });

    fireEvent.click(screen.getByRole("button", { name: /Guardar Cambios/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:4000/api/animals/7",
        expect.objectContaining({
          method: "PATCH",
        })
      );
    });

    const body = JSON.parse(
      ((global.fetch as jest.Mock).mock.calls[0][1] as { body: string }).body
    );
    expect(body).toMatchObject({
      species: "perro",
      size: "mediano",
      gender: "macho",
      status: "disponible",
    });
    expect(body.medical_records).toEqual([
      {
        record_id: 31,
        record_type: "vacunación",
        date_given: "2026-04-14T10:00:00.000Z",
        vet_name: "Dr. Rivera",
        notes: "Updated vaccine note",
      },
      {
        record_type: "examen",
        notes: "New exam note",
      },
    ]);
  });

  it("disables the standalone upload action when storage is unhealthy", async () => {
    render(<AnimalImageUploadForm />);

    const imageInput = await screen.findByLabelText(/Image File/i);
    expect((imageInput as HTMLInputElement).disabled).toBe(true);

    expect(
      (
        screen.getByRole("button", {
          name: /Image Storage Unavailable/i,
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
  });

  it("renders the initial medical records section on the create form", async () => {
    mockFetchUploadConfig.mockResolvedValue(healthyUploadConfig);

    render(<CreateAnimalForm />);

    await screen.findByText(/Almacenamiento de imágenes disponible/i);
    expect(
      screen.getByRole("group", { name: /Registros Médicos Iniciales/i })
    ).toBeTruthy();
    expect(screen.getByLabelText(/Tipo de registro/i)).toBeTruthy();
    expect(screen.getByLabelText(/Fecha del registro/i)).toBeTruthy();
    expect(screen.getByLabelText(/Veterinario/i)).toBeTruthy();
    expect(screen.getByLabelText(/Notas/i)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Agregar otro registro médico/i })
    ).toBeTruthy();
  });

  it("submits multiple initial medical records in the combined payload", async () => {
    mockFetchUploadConfig.mockResolvedValue(healthyUploadConfig);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            ...sampleAnimal,
            aid: 9,
            record_id: null,
          },
          medicalRecordsAttempted: true,
          medicalRecordsRequested: 2,
          medicalRecordsCreatedCount: 2,
          medicalRecordCreated: true,
        }),
    });
    mockUploadAnimalImage.mockResolvedValue({
      objectKey: "animals/9/image.jpg",
      url: "https://cdn.example.com/animals/9/image.jpg",
      urlType: "public",
      contentType: "image/jpeg",
      size: 1234,
    });
    mockUpdateAnimalImageObjectKey.mockResolvedValue({
      ...sampleAnimal,
      aid: 9,
      image_object_key: "animals/9/image.jpg",
    });

    render(<CreateAnimalForm />);

    await screen.findByText(/Almacenamiento de imágenes disponible/i);
    fillRequiredCreateAnimalFields();
    fillMedicalRecordFields(0, {
      record_type: "vacunación",
      date_given: "2026-04-14T10:00",
      vet_name: "Dr. Rivera",
      notes: "Initial intake vaccination",
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Agregar otro registro médico/i })
    );
    fillMedicalRecordFields(1, {
      record_type: "examen",
      date_given: "2026-04-15T11:30",
      vet_name: "Dr. Soto",
      notes: "Initial wellness exam",
    });

    fireEvent.submit(
      screen.getByRole("button", { name: /Crear Animal/i }).closest("form")!
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:4000/api/animals",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    const body = JSON.parse(
      ((global.fetch as jest.Mock).mock.calls[0][1] as { body: string }).body
    );
    expect(body).toMatchObject({
      name: "Luna",
      medical_records: [
        {
          record_type: "vacunación",
          date_given: new Date("2026-04-14T10:00").toISOString(),
          vet_name: "Dr. Rivera",
          notes: "Initial intake vaccination",
        },
        {
          record_type: "examen",
          date_given: new Date("2026-04-15T11:30").toISOString(),
          vet_name: "Dr. Soto",
          notes: "Initial wellness exam",
        },
      ],
    });
    expect(mockUploadAnimalImage).toHaveBeenCalledWith(
      "9",
      expect.any(File)
    );
    await screen.findByText(
      /Animal y 2 registros médicos iniciales se crearon exitosamente con imagen/i
    );
  });

  it("submits only animal fields when the medical section is left blank", async () => {
    mockFetchUploadConfig.mockResolvedValue(healthyUploadConfig);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            ...sampleAnimal,
            aid: 10,
            record_id: null,
          },
          medicalRecordsAttempted: false,
          medicalRecordsRequested: 0,
          medicalRecordsCreatedCount: 0,
          medicalRecordCreated: false,
        }),
    });
    mockUploadAnimalImage.mockResolvedValue({
      objectKey: "animals/10/image.jpg",
      url: "https://cdn.example.com/animals/10/image.jpg",
      urlType: "public",
      contentType: "image/jpeg",
      size: 1234,
    });
    mockUpdateAnimalImageObjectKey.mockResolvedValue({
      ...sampleAnimal,
      aid: 10,
      image_object_key: "animals/10/image.jpg",
    });

    render(<CreateAnimalForm />);

    await screen.findByText(/Almacenamiento de imágenes disponible/i);
    fillRequiredCreateAnimalFields();

    fireEvent.submit(
      screen.getByRole("button", { name: /Crear Animal/i }).closest("form")!
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    const body = JSON.parse(
      ((global.fetch as jest.Mock).mock.calls[0][1] as { body: string }).body
    );
    expect(body.medical_records).toBeUndefined();
    await screen.findByText(/Animal creado exitosamente con imagen/i);
  });

  it("shows a partial-success message before redirecting when some medical records fail", async () => {
    jest.useFakeTimers();
    mockFetchUploadConfig.mockResolvedValue(healthyUploadConfig);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            ...sampleAnimal,
            aid: 11,
            record_id: null,
          },
          medicalRecordsAttempted: true,
          medicalRecordsRequested: 2,
          medicalRecordsCreatedCount: 1,
          medicalRecordCreated: false,
          warnings: [
            {
              code: MEDICAL_RECORD_CREATE_FAILED_CODE,
              index: 1,
              message:
                "Animal created, but initial medical record 2 could not be created.",
            },
          ],
        }),
    });
    mockUploadAnimalImage.mockResolvedValue({
      objectKey: "animals/11/image.jpg",
      url: "https://cdn.example.com/animals/11/image.jpg",
      urlType: "public",
      contentType: "image/jpeg",
      size: 1234,
    });
    mockUpdateAnimalImageObjectKey.mockResolvedValue({
      ...sampleAnimal,
      aid: 11,
      image_object_key: "animals/11/image.jpg",
    });

    render(<CreateAnimalForm />);

    await screen.findByText(/Almacenamiento de imágenes disponible/i);
    fillRequiredCreateAnimalFields();
    fillMedicalRecordFields(0, {
      record_type: "vacunación",
      notes: "Primary medical record",
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Agregar otro registro médico/i })
    );
    fillMedicalRecordFields(1, {
      record_type: "examen",
      notes: "Trigger backend warning",
    });

    fireEvent.submit(
      screen.getByRole("button", { name: /Crear Animal/i }).closest("form")!
    );

    await screen.findByText(
      /animal se creó con imagen, pero solo se pudieron crear 1 de 2 registros médicos iniciales/i
    );
    expect(mockPush).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/admin/animals");
    });

    jest.useRealTimers();
  });
});
