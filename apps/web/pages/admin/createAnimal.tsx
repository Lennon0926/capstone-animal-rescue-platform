import HeaderSection from "@/components/Header/headerSection";
import FooterSection from "@/components/Footer/footerSection";
import CreateAnimalForm from "@/components/Admin/CreateAnimal/createAnimalForm";

export default function CreateAnimalPage() {
  return (
    <>
      <HeaderSection />
      <CreateAnimalForm />
      <FooterSection />
    </>
  );
}
