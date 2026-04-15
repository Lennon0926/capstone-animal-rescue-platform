import { GetServerSideProps } from "next";
import Head from "next/head";
import AnimalInfo from "@/components/Animal/AnimalInfoPage/animalInfo";
import HeaderSection from "@/components/Header/headerSection";
import FooterSection from "@/components/Footer/footerSection";
import type { Animal } from "@/types/animal";

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
      {!animal ? (
        <div>No se encontró el animal.</div>
      ) : (
        <>
          <HeaderSection />
          <AnimalInfo animal={animal} />
          <FooterSection />
        </>
      )}
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
