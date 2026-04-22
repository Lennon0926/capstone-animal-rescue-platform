import {
  buildMedicalRecordsPayload,
  getEmptyMedicalRecord,
} from "@/utils/medicalRecords";

describe("buildMedicalRecordsPayload", () => {
  it("skips blank new records (no record_id)", () => {
    const { medicalRecordsPayload } = buildMedicalRecordsPayload(
      [getEmptyMedicalRecord()],
      { allowRecordId: true }
    );
    expect(medicalRecordsPayload).toBeUndefined();
  });

  it("includes existing records with record_id even when all optional fields are blank", () => {
    const { medicalRecordsPayload } = buildMedicalRecordsPayload(
      [{ record_id: 5, record_type: "", date_given: "", vet_name: "", notes: "" }],
      { allowRecordId: true }
    );
    expect(medicalRecordsPayload).toHaveLength(1);
    expect(medicalRecordsPayload![0].record_id).toBe(5);
  });

  it("sends null clears for blank optional fields on existing records", () => {
    const { medicalRecordsPayload } = buildMedicalRecordsPayload(
      [{ record_id: 5, record_type: "vacunación", date_given: "", vet_name: "", notes: "" }],
      { allowRecordId: true }
    );
    expect(medicalRecordsPayload![0]).toMatchObject({
      record_id: 5,
      record_type: "vacunación",
      date_given: null,
      vet_name: null,
      notes: null,
    });
  });

  it("includes populated fields for existing records", () => {
    const { medicalRecordsPayload } = buildMedicalRecordsPayload(
      [{ record_id: 3, record_type: "examen", date_given: "2026-04-01T10:00", vet_name: "Dr. Soto", notes: "Revisión" }],
      { allowRecordId: true }
    );
    expect(medicalRecordsPayload![0]).toMatchObject({
      record_id: 3,
      record_type: "examen",
      vet_name: "Dr. Soto",
      notes: "Revisión",
    });
  });

  it("returns empty array when preserveEmptyPayload is true and all records are blank new entries", () => {
    const { medicalRecordsPayload } = buildMedicalRecordsPayload(
      [getEmptyMedicalRecord()],
      { preserveEmptyPayload: true }
    );
    expect(medicalRecordsPayload).toEqual([]);
  });
});
