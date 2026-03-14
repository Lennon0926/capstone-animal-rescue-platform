import { GetServerSideProps } from "next";
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
      <HeaderSection />
      <main
        style={{
          minHeight: "100vh",
          padding: "2rem",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <AdminAnimalsList initialAnimals={animals} />
      </main>
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
