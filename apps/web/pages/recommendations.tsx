import Head from "next/head";
import HeaderSection from "@/components/Header/headerSection";
import FooterSection from "@/components/Footer/footerSection";
import RecommendationsPage from "@/components/RecommendationsPage/recommendationsPage";

export default function Recommendations() {
  return (
    <>
      <Head>
        <title>Recomendaciones antes de adoptar | Huellitas Sin Hogar</title>
        <meta
          name="description"
          content="Conoce recomendaciones importantes antes de adoptar una mascota y otras formas de ayudar a los animales rescatados."
        />
      </Head>
      <HeaderSection />
      <RecommendationsPage />
      <FooterSection />
    </>
  );
}
