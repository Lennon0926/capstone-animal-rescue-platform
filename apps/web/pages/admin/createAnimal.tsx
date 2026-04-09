import HeaderSection from "@/components/Header/headerSection";
import CreateAnimalForm from "@/components/Admin/CreateAnimal/createAnimalForm";
import { useAuthRequired } from "@/lib/useAuthRequired";

export default function CreateAnimalPage() {
  const { isLoading } = useAuthRequired();

  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      <HeaderSection />
      <CreateAnimalForm />
    </>
  );
}
