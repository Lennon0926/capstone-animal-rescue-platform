import { GetServerSideProps } from "next";
import AdminHeader from "@/components/Admin/AdminHeader/adminHeader";
import AdminAnimalsList from "@/components/Admin/AdminAnimalsList/adminAnimalsList";
import { useAuthRequired } from "@/lib/useAuthRequired";
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
  const { isLoading } = useAuthRequired();

  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      <AdminHeader />
      <AdminAnimalsList initialAnimals={animals} />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/animals?limit=1000`,
    );

    if (!res.ok) {
      return { props: { animals: [], fetchError: true } };
    }

    const result: ApiResponse = await res.json();

    return {
      props: {
        animals: result.success && result.data ? result.data : [],
      },
    };
  } catch (err) {
    console.error("[admin/animals] getServerSideProps failed:", err);
    return { props: { animals: [], fetchError: true } };
  }
};
