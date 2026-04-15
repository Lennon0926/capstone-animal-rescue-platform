import styles from "./animalInfo.module.css";
import Image from "next/image";
import Link from "next/link";
import { getAnimalImageUrl } from "@/utils/animalImages";
import type { Animal } from "@/types/animal";
import { buildAdoptionFormUrl } from "@/hooks/useAdoptionFormUrl";
import { getMedicalRecordSummary } from "@/utils/medicalRecords";

type AnimalInfoProps = {
  animal: Animal;
};

function capitalize(text: string) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatStatus(status: string) {
  const map: Record<string, string> = {
    disponible: "Disponible",
    adoptado: "Adoptado",
    pendiente: "Pendiente",
    'atención médica': "Atención Médica",
    'en hogar temporal': "En Hogar Temporal",
  };

  return map[status?.toLowerCase()] || status;
}

function getStatusClass(status: string) {
  switch (status.toLowerCase()) {
    case "disponible":
      return styles.available;
    case "adoptado":
      return styles.adopted;
    case "pendiente":
      return styles.pending;
    case "en hogar temporal":
      return styles.fostered;
    case "atención médica":
      return styles.medical;
    default:
      return "";
  }
}

export default function AnimalInfo({ animal }: AnimalInfoProps) {
  const formUrl = buildAdoptionFormUrl(animal.aid, animal.name);
  const medicalRecords = animal.medical_records || [];

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <Link href="/adopt" className={styles.back}>
          ← Volver a Animales
        </Link>

        <div className={styles.container}>
          <div className={styles.imageWrapper}>
            <Image
              src={getAnimalImageUrl(
                animal.image_url,
                animal.species,
                animal.aid,
                animal.image_object_key,
              )}
              alt={animal.name}
              width={600}
              height={600}
              className={styles.image}
              priority
              sizes="(max-width: 900px) 100vw, 50vw"
            />
          </div>

          <div className={styles.content}>
            <div className={styles.header}>
              <h1 className={styles.title}>{animal.name}</h1>
            </div>

            <div className={styles.metaHeader}>
              <span
                className={`${styles.status} ${getStatusClass(animal.status)}`}
              >
                {formatStatus(animal.status)}
              </span>
            </div>

            <div className={styles.meta}>
              <p>
                <strong>Especie:</strong> {capitalize(animal.species)}
              </p>
              <p>
                <strong>Tamaño:</strong> {capitalize(animal.size)}
              </p>
              <p>
                <strong>Género:</strong> {capitalize(animal.gender)}
              </p>
            </div>

            <p className={styles.description}>{animal.description}</p>

            {medicalRecords.length > 0 && (
              <section className={styles.medicalRecordsSection} aria-labelledby="medical-records-title">
                <h2 id="medical-records-title" className={styles.sectionTitle}>
                  Registros médicos
                </h2>
                <div className={styles.medicalRecordsList}>
                  {medicalRecords.map((medicalRecord, index) => {
                    const summary = getMedicalRecordSummary(medicalRecord);

                    return (
                      <article
                        key={medicalRecord.record_id || `${animal.aid}-medical-record-${index}`}
                        className={styles.medicalRecordCard}
                      >
                        <div className={styles.medicalRecordHeader}>
                          <h3 className={styles.medicalRecordType}>
                            {medicalRecord.record_type
                              ? capitalize(medicalRecord.record_type)
                              : `Registro ${index + 1}`}
                          </h3>
                          {summary ? (
                            <p className={styles.medicalRecordMeta}>{summary}</p>
                          ) : null}
                        </div>
                        {medicalRecord.notes ? (
                          <p className={styles.medicalRecordNotes}>
                            <strong>Descripción:</strong> {medicalRecord.notes}
                          </p>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {animal.tags && animal.tags.length > 0 && (
              <div className={styles.tagsSection}>
                <strong>Etiquetas:</strong>
                <div className={styles.tagsList}>
                  {animal.tags.map((tag, index) => (
                    <span key={index} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.actions}>
              {animal.status === "disponible" ? (
                formUrl ? (
                  <a
                    href={formUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.adoptButton}
                  >
                    Iniciar Proceso de Adopción
                  </a>
                ) : (
                  <p className={styles.formUnavailable}>
                    El formulario de adopción no está disponible en este momento.
                    Contáctanos para más información.
                  </p>
                )
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
