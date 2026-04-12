import Head from "next/head";
import HeaderSection from "@/components/Header/headerSection";
import FooterSection from "@/components/Footer/footerSection";
import CreateAnimalForm from "@/components/Admin/CreateAnimal/createAnimalForm";

export default function CreateAnimalPage() {
  return (
    <>
      <Head>
        <title>Crear Animal | Huellitas Sin Hogar</title>
      </Head>
      <HeaderSection />
      <CreateAnimalForm />
      <FooterSection />
    </>
  );
}
