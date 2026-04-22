import type { Animal } from "@/types/animal";

const SPECIES_VALUE_MAP: Readonly<Record<string, string>> = {
  dog: "perro",
  cat: "gato",
};

const SIZE_VALUE_MAP: Readonly<Record<string, string>> = {
  small: "pequeño",
  medium: "mediano",
  large: "grande",
  "very large": "muy grande",
};

const GENDER_VALUE_MAP: Readonly<Record<string, string>> = {
  male: "macho",
  female: "hembra",
  unknown: "desconocido",
};

const STATUS_VALUE_MAP: Readonly<Record<string, string>> = {
  available: "disponible",
  adopted: "adoptado",
  pending: "pendiente",
  "in foster": "en hogar temporal",
  "medical attention": "atención médica",
};

const SPECIES_OPTIONS = new Set(["perro", "gato"]);
const SIZE_OPTIONS = new Set(["pequeño", "mediano", "grande", "muy grande"]);
const GENDER_OPTIONS = new Set(["macho", "hembra", "desconocido"]);
const STATUS_OPTIONS = new Set([
  "disponible",
  "adoptado",
  "pendiente",
  "en hogar temporal",
  "atención médica",
]);

const normalizeLegacySelectValue = (
  value: string,
  validValues: ReadonlySet<string>,
  legacyValueMap: Readonly<Record<string, string>>
) => {
  if (validValues.has(value)) {
    return value;
  }

  const normalizedLookupKey = value.trim().toLowerCase();

  return legacyValueMap[normalizedLookupKey] || value;
};

export const normalizeAdminAnimalFormValues = (animal: Animal): Animal => ({
  ...animal,
  species: normalizeLegacySelectValue(
    animal.species,
    SPECIES_OPTIONS,
    SPECIES_VALUE_MAP
  ),
  size: normalizeLegacySelectValue(animal.size, SIZE_OPTIONS, SIZE_VALUE_MAP),
  gender: normalizeLegacySelectValue(
    animal.gender,
    GENDER_OPTIONS,
    GENDER_VALUE_MAP
  ),
  status: normalizeLegacySelectValue(
    animal.status,
    STATUS_OPTIONS,
    STATUS_VALUE_MAP
  ),
});
