import { GetServerSideProps } from "next";
import AdminHeader from "@/components/Admin/AdminHeader/adminHeader";
import AdminAnimalsList from "@/components/Admin/AdminAnimalsList/adminAnimalsList";
import { useAuthRequired } from "@/lib/useAuthRequired";
import type { Animal } from "@/types/animal";
import type { MedicalRecord } from "@/types/animal";

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

type MedicalRecordsApiResponse = {
  success: boolean;
  data: MedicalRecord[];
};

type AdminAnimalsPageProps = {
  animals: Animal[];
  medicalRecords: MedicalRecord[];
  fetchError?: boolean;
};

export default function AdminAnimalsPage({
  animals,
  medicalRecords,
}: AdminAnimalsPageProps) {
  const { isLoading } = useAuthRequired();

  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      <AdminHeader />
      <AdminAnimalsList
        initialAnimals={animals}
        initialMedicalRecords={medicalRecords}
      />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const [animalsResponse, medicalRecordsResponse] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/animals?limit=100`),
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/animals/records`),
    ]);

    let animals: Animal[] = [];
    let medicalRecords: MedicalRecord[] = [];

    if (animalsResponse.ok) {
      const result: ApiResponse = await animalsResponse.json();

      if (result.success && result.data) {
        animals = result.data;
      }
    }

    if (medicalRecordsResponse.ok) {
      const result: MedicalRecordsApiResponse =
        await medicalRecordsResponse.json();

      if (result.success && result.data) {
        medicalRecords = result.data;
      }
    }

    return {
      props: {
        animals,
        medicalRecords,
      },
    };
  } catch (err) {
    console.error("[admin/animals] getServerSideProps failed:", err);
    return {
      props: {
        animals: [],
        medicalRecords: [],
        fetchError: true,
      },
    };
  }
};
