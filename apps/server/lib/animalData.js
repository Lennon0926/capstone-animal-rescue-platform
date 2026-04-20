const VALID_ANIMAL_SPECIES = ["perro", "gato"];
const VALID_ANIMAL_SIZES = ["pequeño", "mediano", "grande", "muy grande"];
const VALID_ANIMAL_GENDERS = ["macho", "hembra", "desconocido"];
const VALID_ANIMAL_STATUSES = [
  "disponible",
  "adoptado",
  "pendiente",
  "en hogar temporal",
  "atención médica",
];
const VALID_MEDICAL_RECORD_TYPES = [
  "vacunación",
  "desparasitación",
  "esterilización",
  "tratamiento",
  "examen",
  "cirugía",
];

const MEDICAL_RECORD_CREATE_FAILED_CODE = "MEDICAL_RECORD_CREATE_FAILED";

function normalizeMedicalRecordFields(medicalRecordData = {}) {
  const normalizedMedicalRecord = {};
  const hasOwn = (key) => Object.prototype.hasOwnProperty.call(medicalRecordData, key);

  if (medicalRecordData.record_type) {
    normalizedMedicalRecord.record_type = medicalRecordData.record_type;
  }

  if (hasOwn("date_given")) {
    normalizedMedicalRecord.date_given = medicalRecordData.date_given ?? null;
  }

  if (hasOwn("vet_name")) {
    normalizedMedicalRecord.vet_name = medicalRecordData.vet_name ?? null;
  }

  if (hasOwn("notes")) {
    normalizedMedicalRecord.notes = medicalRecordData.notes ?? null;
  }

  if (medicalRecordData.aid) {
    normalizedMedicalRecord.aid = medicalRecordData.aid;
  }

  return normalizedMedicalRecord;
}

function serializeMedicalRecord(record) {
  if (!record) {
    return record;
  }

  return {
    ...record,
    date_given: record.date_given || null,
    vet_name: record.vet_name || null,
    notes: record.notes || null,
  };
}

function buildMedicalRecordCreateWarning(index) {
  return {
    code: MEDICAL_RECORD_CREATE_FAILED_CODE,
    index,
    message: `Animal created, but initial medical record ${index + 1} could not be created.`,
  };
}

function buildMedicalRecordCreationSummary(
  medicalRecordsRequested,
  medicalRecordsCreatedCount,
  warnings = []
) {
  const medicalRecordsAttempted = medicalRecordsRequested > 0;

  return {
    medicalRecordsAttempted,
    medicalRecordsRequested,
    medicalRecordsCreatedCount,
    medicalRecordCreated:
      medicalRecordsAttempted &&
      medicalRecordsCreatedCount === medicalRecordsRequested,
    warnings,
  };
}

module.exports = {
  VALID_ANIMAL_SPECIES,
  VALID_ANIMAL_SIZES,
  VALID_ANIMAL_GENDERS,
  VALID_ANIMAL_STATUSES,
  VALID_MEDICAL_RECORD_TYPES,
  MEDICAL_RECORD_CREATE_FAILED_CODE,
  normalizeMedicalRecordFields,
  serializeMedicalRecord,
  buildMedicalRecordCreateWarning,
  buildMedicalRecordCreationSummary,
};
