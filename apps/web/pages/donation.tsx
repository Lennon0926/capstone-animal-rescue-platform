import Head from "next/head";
import HeaderSection from "@/components/Header/headerSection";
import FooterSection from "@/components/Footer/footerSection";

export const Donation = () => {
  return (
    <div>
      <Head>
        <title>Donar | Huellitas Sin Hogar</title>
        <meta name="description" content="Apoya a Huellitas Sin Hogar con una donación y ayuda a los animales sin hogar de Aguadilla a encontrar una familia." />
      </Head>
      <HeaderSection />
      <h1>Donation Page</h1>
      <FooterSection />
    </div>
  );
};

export default Donation;
