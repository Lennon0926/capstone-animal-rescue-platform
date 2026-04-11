import Head from "next/head";
import HeaderSection from "@/components/Header/headerSection";
import FooterSection from "@/components/Footer/footerSection";
import AboutPage from "@/components/AboutPage/aboutPage";

export const About = () => {
  return (
    <div>
      <Head>
        <title>Quiénes Somos | Huellitas Sin Hogar</title>
      </Head>
      <HeaderSection />
      <AboutPage />
      <FooterSection />
    </div>
  );
};

export default About;
