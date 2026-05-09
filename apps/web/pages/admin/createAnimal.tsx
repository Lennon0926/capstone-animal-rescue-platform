import Head from "next/head";
import AdminHeader from "@/components/Admin/AdminHeader/adminHeader";
import CreateAnimalForm from "@/components/Admin/CreateAnimal/createAnimalForm";
import { useAuthRequired } from "@/lib/useAuthRequired";

export default function CreateAnimalPage() {
  const { isLoading } = useAuthRequired();

  return (
    <>
      <Head>
        <title>Crear Animal | Huellitas Sin Hogar</title>
      </Head>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <AdminHeader />
          <CreateAnimalForm />
        </>
      )}
    </>
  );
}
