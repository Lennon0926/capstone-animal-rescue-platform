import HeaderSection from "@/components/Header/headerSection";
import FooterSection from "@/components/Footer/footerSection";
import AnimalImageUploadForm from "@/components/Animal/animalImageUploadForm";

export default function UploadPage() {
  return (
    <>
      <HeaderSection />
      <main
        style={{
          minHeight: "100vh",
          padding: "2rem",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <h1>Animal Image Management</h1>
        <p style={{ color: "#666", marginBottom: "1rem" }}>
          Upload images to Cloudflare R2 storage and automatically update animal profiles.
        </p>
        <AnimalImageUploadForm />
      </main>
      <FooterSection />
    </>
  );
}
