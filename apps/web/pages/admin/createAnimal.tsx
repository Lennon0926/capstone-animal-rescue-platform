import AdminHeader from "@/components/Admin/AdminHeader/adminHeader";
import CreateAnimalForm from "@/components/Admin/CreateAnimal/createAnimalForm";
import { useAuthRequired } from "@/lib/useAuthRequired";

export default function CreateAnimalPage() {
  const { isLoading } = useAuthRequired();

  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      <AdminHeader />
      <CreateAnimalForm />
    </>
  );
}
