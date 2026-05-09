import { GetServerSideProps } from "next";
import Head from "next/head";
import AdminHeader from "@/components/Admin/AdminHeader/adminHeader";
import EditAnimalForm from "@/components/Admin/EditAnimal/editAnimalForm";
import { useAuthRequired } from "@/lib/useAuthRequired";
import type { Animal } from "@/types/animal";

type ApiResponse = {
  success: boolean;
  data: Animal;
};

type EditAnimalPageProps = {
  animal?: Animal | null;
  error?: string;
};

export default function EditAnimalPage({ animal, error }: EditAnimalPageProps) {
  const { isLoading } = useAuthRequired();

  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      <Head>
        <title>{animal ? `Editar ${animal.name}` : "Editar Animal"} | Huellitas Sin Hogar</title>
      </Head>
      <AdminHeader />
      {error ? (
        <EditAnimalForm error={error} />
      ) : animal ? (
        <EditAnimalForm animal={animal} />
      ) : (
        <EditAnimalForm notFound />
      )}
    </>
  );
}

export const getServerSideProps: GetServerSideProps<
  EditAnimalPageProps
> = async (context) => {
  const { id } = context.query;

  if (!id) {
    return {
      props: {
        error: "Animal ID is required.",
      },
    };
  }

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/animals/${id}`,
    );

    if (!res.ok) {
      return {
        props: {
          error: "Animal not found.",
        },
      };
    }

    const result: ApiResponse = await res.json();

    if (!result.success || !result.data) {
      return {
        props: {
          error: "Failed to load animal data.",
        },
      };
    }

    return {
      props: {
        animal: result.data,
      },
    };
  } catch (err) {
    console.error("[admin/editAnimal] getServerSideProps failed:", err);
    return {
      props: {
        error: "Failed to fetch animal data.",
      },
    };
  }
};
