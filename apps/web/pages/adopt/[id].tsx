import { GetServerSideProps } from "next";
import AnimalInfo from "@/components/Animal/AnimalInfoPage/animalInfo";
import HeaderSection from "@/components/Header/headerSection";

type AnimalApiData = {
  aid: number;
  name: string;
  description: string;
  species: string;
  size: string;
  gender: string;
  status: string;
  image_url: string;
  tags: string[];
  created_at: string;
  record_id: number | null;
};

type ApiResponse = {
  success: boolean;
  data: AnimalApiData;
};

type AnimalInfoPageProps = {
  animal: AnimalApiData | null;
};

export default function AdoptAnimalPage({ animal }: AnimalInfoPageProps) {
  if (!animal) {
    return <div>No se encontró el animal.</div>;
  }

  return (
    <div>
      <HeaderSection />
      <AnimalInfo animal={animal} />
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
  } catch {
    return {
      props: {
        animal: null,
      },
    };
  }
};
