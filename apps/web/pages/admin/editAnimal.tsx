import { GetServerSideProps } from "next";
import HeaderSection from "@/components/Header/headerSection";
import FooterSection from "@/components/Footer/footerSection";
import EditAnimalForm from "@/components/Admin/EditAnimal/editAnimalForm";
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
        {error ? (
          <div
            style={{
              padding: "2rem",
              backgroundColor: "#fee",
              borderRadius: "8px",
              color: "#c00",
            }}
          >
            <h1>Error</h1>
            <p>{error}</p>
          </div>
        ) : animal ? (
          <EditAnimalForm animal={animal} />
        ) : (
          <div
            style={{
              padding: "2rem",
              backgroundColor: "#f5f5f5",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <h1>Animal Not Found</h1>
            <p>The animal you&apos;re trying to edit could not be found.</p>
          </div>
        )}
      </main>
      <FooterSection />
    </>
  );
}

export const getServerSideProps: GetServerSideProps<EditAnimalPageProps> = async (
  context
) => {
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
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/animals/${id}`
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
