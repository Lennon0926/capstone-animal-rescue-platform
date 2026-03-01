import AnimalImageUploadForm from "@/components/animalImageUploadForm";
import HelloWorldDisplay from "@/components/helloWorld";

function Index() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Capstone Animal Rescue Platform</h1>
      <HelloWorldDisplay />
      <AnimalImageUploadForm />
    </main>
  );
}

export default Index;
