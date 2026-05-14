import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import AnimalInfo from "@/components/Animal/AnimalInfoPage/animalInfo";
import HeaderSection from "@/components/Header/headerSection";
import FooterSection from "@/components/Footer/footerSection";
import type { Animal } from "@/types/animal";
import styles from "./adoptAnimalPage.module.css";

type ApiResponse = {
  success: boolean;
  data: Animal;
};

type AnimalInfoPageProps = {
  animal: Animal | null;
};

export default function AdoptAnimalPage({ animal }: AnimalInfoPageProps) {
  return (
    <div>
      <Head>
        <title>{animal ? `${animal.name} | Huellitas Sin Hogar` : "Animal | Huellitas Sin Hogar"}</title>
        <meta name="description" content={animal ? `Adopta a ${animal.name} en Huellitas Sin Hogar. ${animal.description ?? ""}`.trim() : "Conoce a los animales disponibles para adopción en Huellitas Sin Hogar."} />
      </Head>
      <HeaderSection />
      <main className={styles.main}>
        {!animal ? (
          <section className={styles.notFound} aria-labelledby="animal-not-found-title">
            <h1 id="animal-not-found-title" className={styles.notFoundTitle}>
              Animal no encontrado
            </h1>
            <p className={styles.notFoundText}>
              Este perfil no está disponible en este momento. Puedes volver al listado para conocer otros animales listos para adopción.
            </p>
            <h2 className={styles.notFoundSubtitle}>Explora otros perfiles</h2>
            <Link href="/adopt" className={styles.notFoundLink}>
              Ver animales en adopción
            </Link>
          </section>
        ) : (
          <AnimalInfo animal={animal} />
        )}
      </main>
      <FooterSection />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params || {};

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/animals/${id}`
    );

    if (!res.ok) {
      return {
        props: {
          animal: null,
        },
      };
    }

    const result: ApiResponse = await res.json();

    if (!result.success || !result.data) {
      return {
        props: {
          animal: null,
        },
      };
    }

    return {
      props: {
        animal: result.data,
      },
    };
  } catch (err) {
    console.error("[adopt/[id]] getServerSideProps failed:", err);
    return {
      props: {
        animal: null,
      },
    };
  }
};
