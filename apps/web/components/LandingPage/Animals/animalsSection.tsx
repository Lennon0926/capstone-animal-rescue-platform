import styles from "./animalsSection.module.css";
import Link from "next/link";
import Image from "next/image";

const mockAnimals = [
  {
    id: 1,
    name: "Max",
    species: "Dog",
    breed: "Mixed Breed",
    age: "3 years",
    image: "/Animals/dog1.jpeg",
    status: "Available",
  },
  {
    id: 2,
    name: "Luna",
    species: "Cat",
    breed: "Domestic Shorthair",
    age: "2 years",
    image: "/Animals/cat1.jpeg",
    status: "Available",
  },
  {
    id: 3,
    name: "Charlie",
    species: "Dog",
    breed: "Golden Retriever",
    age: "5 years",
    image: "/Animals/dog2.jpeg",
    status: "Available",
  },
];

export default function AnimalsSection() {
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
          <Link href="/animals" className={styles.viewAll}>
            Ver Todos →
          </Link>
        </div>

        <div className={styles.grid}>
          {mockAnimals.map((animal) => (
            <div key={animal.id} className={styles.card}>
              <div className={styles.imageWrapper}>
                <Image
                  src={animal.image}
                  alt={animal.name}
                  width={400}
                  height={300}
                  style={{ objectFit: "cover", width: "100%", height: "auto" }}
                />
              </div>

              <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                  <h3>{animal.name}</h3>
                  <span className={styles.status}>{animal.status}</span>
                </div>

                <p className={styles.meta}>
                  {animal.breed} • {animal.age}
                </p>

                <Link
                  href={`/animalInfo/`}
                  className={styles.learnMore}
                >
                  Conoce Más
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
