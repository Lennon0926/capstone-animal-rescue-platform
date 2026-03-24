import styles from "./animalsSection.module.css";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

interface Animal {
  aid: number;
  name: string;
  species: string;
  breed: string;
  age_years?: number;
  age_months?: number;
  primary_image_url?: string;
  status: string;
}

export default function AnimalsSection() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnimals() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/animals?status=available&limit=3&sortBy=created_at&sortOrder=asc`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch animals");
        }

        const result = await response.json();
        setAnimals(result.data || []);
      } catch (err) {
        console.error("Error fetching animals:", err);
        setError("No se pudieron cargar los animales");
      } finally {
        setLoading(false);
      }
    }

    fetchAnimals();
  }, []);

  if (loading) {
    return (
      <section className={styles.section}>
        <div className={styles.inner}>
          <div className={styles.header}>
            <div className={styles.headerContainer}>
              <h2 className={styles.title}>Conoce a Nuestros Animales</h2>
              <p className={styles.subtitle}>Cargando...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.section}>
        <div className={styles.inner}>
          <div className={styles.header}>
            <div className={styles.headerContainer}>
              <h2 className={styles.title}>Conoce a Nuestros Animales</h2>
              <p className={styles.subtitle}>{error}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <div className={styles.headerContainer}>
            <h2 className={styles.title}>Conoce a Nuestros Animales</h2>
            <p className={styles.subtitle}>
              Cada uno de estos maravillosos compañeros espera una familia que le brinde amor,
              cuidado y la oportunidad de comenzar una nueva etapa llena de esperanza.
            </p>
          </div>
        </div>

        <div className={styles.grid}>
          {animals.map((animal) => (
            <div key={animal.aid} className={styles.card}>
              <div className={styles.imageWrapper}>
                <Image
                  src={animal.primary_image_url || "/Animals/placeholder.jpeg"}
                  alt={animal.name}
                  width={400}
                  height={300}
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
        <Link href="/adopt" className={styles.viewAll}>
            Ver Todos →
          </Link>
      </div>
    </section>
  );
}
