import type { Animal } from "@/types/animal";
import { normalizeAdminAnimalFormValues } from "@/utils/adminAnimalFormValues";

const baseAnimal: Animal = {
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

describe("normalizeAdminAnimalFormValues", () => {
  it("maps known legacy English enum values to the Spanish form vocabulary", () => {
    expect(
      normalizeAdminAnimalFormValues({
        ...baseAnimal,
        species: "dog",
        size: "very large",
        gender: "male",
        status: "medical attention",
      })
    ).toMatchObject({
      species: "perro",
      size: "muy grande",
      gender: "macho",
      status: "atención médica",
    });
  });

  it("preserves already-localized values", () => {
    expect(normalizeAdminAnimalFormValues(baseAnimal)).toEqual(baseAnimal);
  });

  it("preserves unknown values so validation can still surface them", () => {
    expect(
      normalizeAdminAnimalFormValues({
        ...baseAnimal,
        species: "conejo",
        size: "gigante",
        gender: "nonbinary",
        status: "archived",
      })
    ).toMatchObject({
      species: "conejo",
      size: "gigante",
      gender: "nonbinary",
      status: "archived",
    });
  });
});
