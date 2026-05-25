import { useState } from "react";
import { GetServerSideProps } from "next";
import Head from "next/head";
import HeaderSection from "@/components/Header/headerSection";
import FooterSection from "@/components/Footer/footerSection";
import AdoptPage from "@/components/AdoptPage/adoptPage";
import AIPetMatch from "@/components/AIPetMatch/aiPetMatch";
import type { Animal } from "@/types/animal";

type ApiResponse = {
  success: boolean;
  data: Animal[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

type AdoptPageProps = {
  animals: Animal[];
  fetchError?: boolean;
};

type Stage = "ai" | "listing";

export default function Adopt({ animals }: AdoptPageProps) {
  const [stage, setStage] = useState<Stage>("ai");

  return (
    <>
      <Head>
        <title>Adoptar | Huellitas Sin Hogar</title>
        <meta
          name="description"
          content="Explora los animales disponibles para adopción en Huellitas Sin Hogar y encuentra a tu nuevo compañero de vida."
        />
      </Head>
      <HeaderSection />
      {stage === "ai" ? (
        <AIPetMatch onSkip={() => setStage("listing")} />
      ) : (
        <AdoptPage animals={animals} />
      )}
      <FooterSection />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/animals?status=available&limit=100`
    );

    if (!res.ok) {
      return {
        props: {
          animals: [],
        },
      };
    }

    const result: ApiResponse = await res.json();

    if (!result.success || !result.data) {
      return {
        props: {
          animals: [],
        },
      };
    }

    return {
      props: {
        animals: result.data,
      },
    };
  } catch (err) {
    console.error("[adopt/index] getServerSideProps failed:", err);
    return {
      props: {
        animals: [],
        fetchError: true,
      },
    };
  }
};
