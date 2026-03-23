import styles from "./animalInfo.module.css";
import Image from "next/image";
import Link from "next/link";
import { getAnimalImageUrl } from "@/utils/animalImages";
import type { Animal } from "@/types/animal";

type AnimalInfoProps = {
  animal: Animal;
};

function capitalize(text: string) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatStatus(status: string) {
  const map: Record<string, string> = {
    available: "Disponible",
    adopted: "Adoptado",
    pending: "Pendiente",
  };

  return map[status?.toLowerCase()] || status;
}

export default function AnimalInfo({ animal }: AnimalInfoProps) {

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <Link href="/adopt" className={styles.back}>
          ← Volver a Animales
        </Link>

        <div className={styles.container}>
          <div className={styles.imageWrapper}>
            <Image
              src={getAnimalImageUrl(animal.image_url, animal.species, animal.aid)}
              alt={animal.name}
              width={600}
              height={600}
              className={styles.image}
            />
          </div>

          <div className={styles.content}>
            <div className={styles.header}>
              <h1 className={styles.title}>{animal.name}</h1>
            </div>

            <div className={styles.metaHeader}>
              <span
                className={`${styles.status} ${
                  animal.status === "available"
                    ? styles.available
                    : animal.status === "pending"
                    ? styles.pending
                    : styles.adopted
                }`}
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
              <Link href="/adopt" className={styles.adoptButton}>
                Iniciar Proceso de Adopción
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}