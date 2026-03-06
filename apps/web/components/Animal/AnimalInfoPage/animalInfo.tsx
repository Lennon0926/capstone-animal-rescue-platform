import styles from "./animalInfo.module.css";
import Image from "next/image";
import Link from "next/link";

const animal = {
  name: "Max",
  species: "Perro",
  breed: "Mixed Breed",
  age: "3 años",
  size: "Mediano",
  gender: "Macho",
  status: "Available",
  image: "/Animals/dog1.jpeg",
  description:
    "Max es un perro muy cariñoso y juguetón que disfruta pasar tiempo con las personas. Le encanta salir a caminar, jugar con pelotas y recibir mucha atención. Está buscando una familia que pueda brindarle amor, estabilidad y un hogar para siempre.",
};

export default function AnimalDetailsPage() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>

        <Link href="/animals" className={styles.back}>
          ← Volver a Animales
        </Link>

        <div className={styles.container}>

          <div className={styles.imageWrapper}>
            <Image
              src={animal.image}
              alt={animal.name}
              width={600}
              height={600}
              className={styles.image}
            />
          </div>

          <div className={styles.content}>
            <div className={styles.header}>
              <h1 className={styles.title}>{animal.name}</h1>
              <span
                className={`${styles.status} ${
                  animal.status === "Available"
                    ? styles.available
                    : styles.adopted
                }`}
              >
                {animal.status === "Available" ? "Disponible" : "Adoptado"}
              </span>
            </div>

            <div className={styles.meta}>
              <p><strong>Especie:</strong> {animal.species}</p>
              <p><strong>Raza:</strong> {animal.breed}</p>
              <p><strong>Edad:</strong> {animal.age}</p>
              <p><strong>Tamaño:</strong> {animal.size}</p>
              <p><strong>Género:</strong> {animal.gender}</p>
            </div>

            <p className={styles.description}>
              {animal.description}
            </p>

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