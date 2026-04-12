import Head from "next/head";
import HeaderSection from "@/components/Header/headerSection";
import FooterSection from "@/components/Footer/footerSection";
import AboutPage from "@/components/AboutPage/aboutPage";

export const About = () => {
  return (
    <div>
      <Head>
        <title>Quiénes Somos | Huellitas Sin Hogar</title>
        <meta name="description" content="Conoce a Ciudadanos Pro Albergue de Animales de Aguadilla (CPAAA), nuestra misión y el equipo detrás de Huellitas Sin Hogar." />
      </Head>
      <HeaderSection />
      <AboutPage />
      <FooterSection />
    </div>
  );
};

export default About;
