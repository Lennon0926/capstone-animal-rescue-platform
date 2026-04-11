import Head from "next/head";
import HeaderSection from "@/components/Header/headerSection";
import FooterSection from "@/components/Footer/footerSection";

export const Donation = () => {
  return (
    <div>
      <Head>
        <title>Donar | Huellitas Sin Hogar</title>
      </Head>
      <HeaderSection />
      <h1>Donation Page</h1>
      <FooterSection />
    </div>
  );
};

export default Donation;
