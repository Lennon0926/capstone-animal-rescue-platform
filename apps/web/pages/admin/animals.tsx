import HeaderSection from "@/components/Header/headerSection";
import FooterSection from "@/components/Footer/footerSection";
import AdminAnimalsList from "@/components/Admin/AdminAnimalsList/adminAnimalsList";

export default function AdminAnimalsPage() {
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
        <AdminAnimalsList />
      </main>
      <FooterSection />
    </>
  );
}
