import { GetServerSideProps } from "next";
import HeaderSection from "@/components/Header/headerSection";
import FooterSection from "@/components/Footer/footerSection";
import AdoptPage from "@/components/AdoptPage/adoptPage";

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
  data: AnimalApiData[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

type AdoptPageProps = {
  animals: AnimalApiData[];
};

export default function Adopt({ animals }: AdoptPageProps) {
  return (
    <>
      <HeaderSection />
      <AdoptPage animals={animals} />
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
  } catch {
    return {
      props: {
        animals: [],
      },
    };
  }
};
