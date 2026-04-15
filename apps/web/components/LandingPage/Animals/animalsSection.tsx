import styles from "./animalsSection.module.css";
import Link from "next/link";
import Image from "next/image";
import { getAnimalImageUrl } from "@/utils/animalImages";
import type { Animal } from "@/types/animal";

interface AnimalsSectionProps {
  animals: Animal[];
  fetchError?: boolean;
}

export default function AnimalsSection({
  animals,
  fetchError = false,
}: AnimalsSectionProps) {
  const statusMessage = fetchError
    ? "No se pudieron cargar los animales."
    : animals.length === 0
      ? "No hay animales disponibles en este momento."
      : null;

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <div className={styles.headerContainer}>
            <h2 className={styles.title}>Conoce a Nuestros Animales</h2>
          </div>
        </div>

        {statusMessage && <p className={styles.emptyState}>{statusMessage}</p>}

        {animals.length > 0 && (
          <div className={styles.grid}>
            {animals.map((animal) => (
              <article key={animal.aid} className={styles.card}>
                <div className={styles.imageWrapper}>
                  <Image
                    src={getAnimalImageUrl(
                      animal.image_url,
                      animal.species,
                      animal.aid,
                      animal.image_object_key,
                    )}
                    alt={animal.name}
                    width={400}
                    height={300}
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    style={{ objectFit: "cover", width: "100%", height: "100%" }}
                  />
                  <Link
                    href={`/adopt/${animal.aid}`}
                    className={styles.learnMore}
                    aria-label={`Conocer mas sobre ${animal.name}`}
                  >
                    Conocer mas
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
        <Link href="/adopt" className={styles.viewAll}>
          Ver Todos →
        </Link>
      </div>
    </section>
  );
}
