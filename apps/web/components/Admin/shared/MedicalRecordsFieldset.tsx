import type { ChangeEvent } from "react";
import {
  MEDICAL_RECORD_TYPE_OPTIONS,
  type MedicalRecordFormData,
} from "@/utils/medicalRecords";

type MedicalRecordFieldsetStyles = Readonly<Record<string, string>>;

type MedicalRecordsFieldsetProps = {
  title: string;
  description: string;
  addButtonLabel: string;
  notesPlaceholder: string;
  medicalRecords: MedicalRecordFormData[];
  styles: MedicalRecordFieldsetStyles;
  onMedicalRecordChange: (
    index: number,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  onAddMedicalRecord: () => void;
  onRemoveMedicalRecord: (index: number) => void;
  hideRemoveButtonWhenSingle?: boolean;
  emptyStateMessage?: string;
  getMedicalRecordKey?: (medicalRecord: MedicalRecordFormData, index: number) => string | number;
};

export default function MedicalRecordsFieldset({
  title,
  description,
  addButtonLabel,
  notesPlaceholder,
  medicalRecords,
  styles,
  onMedicalRecordChange,
  onAddMedicalRecord,
  onRemoveMedicalRecord,
  hideRemoveButtonWhenSingle = false,
  emptyStateMessage,
  getMedicalRecordKey,
}: MedicalRecordsFieldsetProps) {
  const showRemoveButton = !hideRemoveButtonWhenSingle || medicalRecords.length > 1;

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{title}</legend>

      <p className={styles.helpText}>{description}</p>

      {medicalRecords.length > 0 ? (
        <div className={styles.medicalRecordsList}>
          {medicalRecords.map((medicalRecord, index) => (
            <div
              key={getMedicalRecordKey?.(medicalRecord, index) || `medical-record-${index}`}
              className={styles.medicalRecordCard}
            >
              <div className={styles.medicalRecordCardHeader}>
                <p className={styles.medicalRecordCardTitle}>Registro {index + 1}</p>
                {showRemoveButton ? (
                  <button
                    type="button"
                    onClick={() => onRemoveMedicalRecord(index)}
                    className={styles.removeMedicalRecordButton}
                  >
                    Eliminar registro
                  </button>
                ) : null}
              </div>

              <div className={styles.medicalRecordCardFields}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label
                      htmlFor={`medical_records_${index}_record_type`}
                      className={styles.label}
                    >
                      Tipo de registro
                    </label>
                    <select
                      id={`medical_records_${index}_record_type`}
                      name="record_type"
                      value={medicalRecord.record_type}
                      onChange={(event) => onMedicalRecordChange(index, event)}
                      className={styles.select}
                    >
                      <option value="">Selecciona un tipo</option>
                      {MEDICAL_RECORD_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label
                      htmlFor={`medical_records_${index}_date_given`}
                      className={styles.label}
                    >
                      Fecha del registro
                    </label>
                    <input
                      id={`medical_records_${index}_date_given`}
                      type="datetime-local"
                      name="date_given"
                      value={medicalRecord.date_given}
                      onChange={(event) => onMedicalRecordChange(index, event)}
                      className={styles.input}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label
                    htmlFor={`medical_records_${index}_vet_name`}
                    className={styles.label}
                  >
                    Veterinario
                  </label>
                  <input
                    id={`medical_records_${index}_vet_name`}
                    type="text"
                    name="vet_name"
                    value={medicalRecord.vet_name}
                    onChange={(event) => onMedicalRecordChange(index, event)}
                    className={styles.input}
                    placeholder="Ej. Dr. Rivera"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label
                    htmlFor={`medical_records_${index}_notes`}
                    className={styles.label}
                  >
                    Notas
                  </label>
                  <textarea
                    id={`medical_records_${index}_notes`}
                    name="notes"
                    value={medicalRecord.notes}
                    onChange={(event) => onMedicalRecordChange(index, event)}
                    className={styles.textarea}
                    placeholder={notesPlaceholder}
                    rows={4}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : emptyStateMessage ? (
        <p className={styles.helpText}>{emptyStateMessage}</p>
      ) : null}

      <button
        type="button"
        onClick={onAddMedicalRecord}
        className={styles.secondaryButton}
      >
        {addButtonLabel}
      </button>
    </fieldset>
  );
}
