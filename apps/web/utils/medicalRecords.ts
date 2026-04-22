import type { Animal, MedicalRecord } from "@/types/animal";

export type MedicalRecordFormFieldName =
  | "record_type"
  | "date_given"
  | "vet_name"
  | "notes";

export type MedicalRecordFormData = {
  record_id?: number;
  record_type: string;
  date_given: string;
  vet_name: string;
  notes: string;
};

type BuildMedicalRecordsPayloadOptions = {
  allowRecordId?: boolean;
  invalidDateMessage?: (recordNumber: number) => string;
  preserveEmptyPayload?: boolean;
};

type MedicalRecordCreationSummary = {
  medicalRecordsRequested?: number;
  medicalRecordsCreatedCount?: number;
};

const MEDICAL_RECORD_INPUT_DATE_SLICE_END = 16;
const MEDICAL_RECORD_TIMEZONE_OFFSET_MS = 60_000;
const MEDICAL_RECORD_DISPLAY_LOCALE = "es-MX";

export const CREATE_ANIMAL_REDIRECT_DELAY_MS = 1_500;
export const EDIT_ANIMAL_REDIRECT_DELAY_MS = 2_000;

export const MEDICAL_RECORD_TYPE_OPTIONS = [
  { value: "vacunación", label: "Vacunación" },
  { value: "desparasitación", label: "Desparasitación" },
  { value: "esterilización", label: "Esterilización" },
  { value: "tratamiento", label: "Tratamiento" },
  { value: "examen", label: "Examen" },
  { value: "cirugía", label: "Cirugía" },
] as const;

export const getEmptyMedicalRecord = (): MedicalRecordFormData => ({
  record_type: "",
  date_given: "",
  vet_name: "",
  notes: "",
});

export const addEmptyMedicalRecord = (
  medicalRecords: MedicalRecordFormData[]
): MedicalRecordFormData[] => [...medicalRecords, getEmptyMedicalRecord()];

export const removeMedicalRecordAtIndex = (
  medicalRecords: MedicalRecordFormData[],
  indexToRemove: number
): MedicalRecordFormData[] =>
  medicalRecords.filter((_, medicalRecordIndex) => medicalRecordIndex !== indexToRemove);

export const updateMedicalRecordAtIndex = (
  medicalRecords: MedicalRecordFormData[],
  indexToUpdate: number,
  fieldName: MedicalRecordFormFieldName,
  value: string
): MedicalRecordFormData[] =>
  medicalRecords.map((medicalRecord, medicalRecordIndex) =>
    medicalRecordIndex === indexToUpdate
      ? {
          ...medicalRecord,
          [fieldName]: value,
        }
      : medicalRecord
  );

export const hasMedicalRecordValues = (medicalRecord: MedicalRecordFormData) =>
  [
    medicalRecord.record_type,
    medicalRecord.date_given,
    medicalRecord.vet_name,
    medicalRecord.notes,
  ].some((value) => value.trim() !== "");

export const formatMedicalRecordDateForInput = (value?: string | null) => {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const offsetMilliseconds =
    parsedDate.getTimezoneOffset() * MEDICAL_RECORD_TIMEZONE_OFFSET_MS;

  return new Date(parsedDate.getTime() - offsetMilliseconds)
    .toISOString()
    .slice(0, MEDICAL_RECORD_INPUT_DATE_SLICE_END);
};

export const formatMedicalRecordDateForDisplay = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toLocaleString(MEDICAL_RECORD_DISPLAY_LOCALE, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export const getInitialMedicalRecords = (animal?: Animal): MedicalRecordFormData[] => {
  if (!animal?.medical_records?.length) {
    return [];
  }

  return animal.medical_records.map((medicalRecord) => ({
    record_id: medicalRecord.record_id,
    record_type: medicalRecord.record_type || "",
    date_given: formatMedicalRecordDateForInput(medicalRecord.date_given),
    vet_name: medicalRecord.vet_name || "",
    notes: medicalRecord.notes || "",
  }));
};

export const buildMedicalRecordsPayload = (
  medicalRecords: MedicalRecordFormData[],
  options: BuildMedicalRecordsPayloadOptions = {}
): {
  medicalRecordsPayload?: MedicalRecord[];
  errorMessage?: string;
} => {
  const {
    allowRecordId = false,
    invalidDateMessage = () => "La fecha de un registro médico no es válida.",
    preserveEmptyPayload = false,
  } = options;
  const medicalRecordsPayload: MedicalRecord[] = [];

  for (let index = 0; index < medicalRecords.length; index += 1) {
    const medicalRecord = medicalRecords[index];
    const shouldEmitNullClearsForOptionalFields =
      allowRecordId && Boolean(medicalRecord.record_id);

    const isExistingRecord = allowRecordId && Boolean(medicalRecord.record_id);

    if (!hasMedicalRecordValues(medicalRecord) && !isExistingRecord) {
      continue;
    }

    const payload: MedicalRecord = {};

    if (allowRecordId && medicalRecord.record_id) {
      payload.record_id = medicalRecord.record_id;
    }

    if (medicalRecord.record_type.trim()) {
      payload.record_type = medicalRecord.record_type.trim();
    }

    if (medicalRecord.date_given.trim()) {
      const parsedDate = new Date(medicalRecord.date_given);

      if (Number.isNaN(parsedDate.getTime())) {
        return {
          errorMessage: invalidDateMessage(index + 1),
        };
      }

      payload.date_given = parsedDate.toISOString();
    } else if (shouldEmitNullClearsForOptionalFields) {
      payload.date_given = null;
    }

    if (medicalRecord.vet_name.trim()) {
      payload.vet_name = medicalRecord.vet_name.trim();
    } else if (shouldEmitNullClearsForOptionalFields) {
      payload.vet_name = null;
    }

    if (medicalRecord.notes.trim()) {
      payload.notes = medicalRecord.notes.trim();
    } else if (shouldEmitNullClearsForOptionalFields) {
      payload.notes = null;
    }

    medicalRecordsPayload.push(payload);
  }

  return {
    medicalRecordsPayload:
      medicalRecordsPayload.length > 0 || preserveEmptyPayload
        ? medicalRecordsPayload
        : undefined,
  };
};

export const getMedicalRecordSummary = (medicalRecord: MedicalRecord) => {
  const details: string[] = [];
  const formattedDate = formatMedicalRecordDateForDisplay(medicalRecord.date_given);

  if (formattedDate) {
    details.push(`Fecha: ${formattedDate}`);
  }

  if (medicalRecord.vet_name) {
    details.push(`Veterinario: ${medicalRecord.vet_name}`);
  }

  return details.join(" · ");
};

export const getCreateAnimalSuccessMessage = (
  result: MedicalRecordCreationSummary
) => {
  const requested = result.medicalRecordsRequested ?? 0;
  const created = result.medicalRecordsCreatedCount ?? 0;

  if (requested > 0 && created === requested) {
    return created === 1
      ? "¡Animal y el registro médico inicial se crearon exitosamente con imagen!"
      : `¡Animal y ${created} registros médicos iniciales se crearon exitosamente con imagen!`;
  }

  if (requested > 0 && created < requested) {
    if (created === 0) {
      return requested === 1
        ? "El animal se creó con imagen, pero no se pudo crear el registro médico inicial."
        : "El animal se creó con imagen, pero no se pudo crear ningún registro médico inicial.";
    }

    return `El animal se creó con imagen, pero solo se pudieron crear ${created} de ${requested} registros médicos iniciales.`;
  }

  return "¡Animal creado exitosamente con imagen!";
};
