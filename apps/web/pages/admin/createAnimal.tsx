import HeaderSection from "@/components/Header/headerSection";
import FooterSection from "@/components/Footer/footerSection";
import CreateAnimalForm from "@/components/Admin/CreateAnimal/createAnimalForm";

export default function CreateAnimalPage() {
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
        <CreateAnimalForm />
      </main>
      <FooterSection />
    </>
  );
}
