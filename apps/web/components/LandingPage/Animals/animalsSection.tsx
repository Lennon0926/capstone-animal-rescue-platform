import styles from "./animalsSection.module.css";
import Link from "next/link";
import Image from "next/image";
import { getAnimalImageUrl } from "@/utils/animalImages";
import type { Animal } from "@/types/animal";

interface AnimalsSectionProps {
  animals: Animal[];
  fetchError?: boolean;
}

const DEFAULT_SUBTITLE =
  "Cada uno de estos maravillosos compañeros espera una familia que le brinde amor, cuidado y la oportunidad de comenzar una nueva etapa llena de esperanza.";

export default function AnimalsSection({
  animals,
  fetchError = false,
}: AnimalsSectionProps) {
  const subtitle = fetchError
    ? "No se pudieron cargar los animales."
    : animals.length === 0
      ? "No hay animales disponibles en este momento."
      : DEFAULT_SUBTITLE;

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <div className={styles.headerContainer}>
            <h2 className={styles.title}>Conoce a Nuestros Animales</h2>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>
        </div>

        {animals.length > 0 && (
          <div className={styles.grid}>
            {animals.map((animal) => (
              <div key={animal.aid} className={styles.card}>
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
                </div>

                <div className={styles.cardContent}>
                  <div className={styles.cardHeader}>
                    <h3>{animal.name}</h3>
                    <span className={styles.status}>Disponible</span>
                  </div>

                  <Link
                    href={`/adopt/${animal.aid}`}
                    className={styles.learnMore}
                  >
                    Conoce Más
                  </Link>
                </div>
              </div>
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
