import { GetServerSideProps } from "next";
import Head from "next/head";
import HeaderSection from "@/components/Header/headerSection";
import FooterSection from "@/components/Footer/footerSection";
import AdminAnimalsList from "@/components/Admin/AdminAnimalsList/adminAnimalsList";
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

type AdminAnimalsPageProps = {
  animals: Animal[];
  fetchError?: boolean;
};

export default function AdminAnimalsPage({ animals }: AdminAnimalsPageProps) {
  return (
    <>
      <Head>
        <title>Administrar Animales | Huellitas Sin Hogar</title>
      </Head>
      <HeaderSection />
      <AdminAnimalsList initialAnimals={animals} />
      <FooterSection />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/animals?limit=100`
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
    console.error("[admin/animals] getServerSideProps failed:", err);
    return {
      props: {
        animals: [],
        fetchError: true,
      },
    };
  }
};
