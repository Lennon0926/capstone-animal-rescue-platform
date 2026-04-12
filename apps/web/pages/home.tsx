import type { GetStaticProps } from "next";
import Head from "next/head";
import HeaderSection from "@/components/Header/headerSection";
import DonationSection from "@/components/LandingPage/Donate/donationSection";
import OurMissionSection from "@/components/LandingPage/Mission/ourMissionSection";
import AnimalsSection from "@/components/LandingPage/Animals/animalsSection";
import HowItWorks from "@/components/LandingPage/HowItWorks/howItWorksSection";
import DonationBanner from "@/components/LandingPage/Donate/donationBanner";
import FooterSection from "@/components/Footer/footerSection";
import type { Animal } from "@/types/animal";

type ApiResponse = {
  success: boolean;
  data: Animal[];
};

type HomeProps = {
  animals: Animal[];
  fetchError?: boolean;
};

function Home({ animals, fetchError }: HomeProps) {
  return (
    <div>
      <Head>
        <title>Inicio | Huellitas Sin Hogar</title>
        <meta name="description" content="Huellitas Sin Hogar — adopta, dona y apoya a los animales sin hogar de Aguadilla, Puerto Rico." />
      </Head>
      <HeaderSection />
      <DonationSection />
      <OurMissionSection />
      <AnimalsSection animals={animals} fetchError={fetchError} />
      <HowItWorks />
      <DonationBanner />
      <FooterSection />
    </div>
  );
}

export default Home;

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/animals?status=disponible&limit=3&sortBy=created_at&sortOrder=asc`
    );

    if (!response.ok) {
      return { props: { animals: [], fetchError: true }, revalidate: 60 };
    }

    const result: ApiResponse = await response.json();

    if (!result.success || !result.data) {
      return { props: { animals: [], fetchError: true }, revalidate: 60 };
    }

    return { props: { animals: result.data }, revalidate: 60 };
  } catch (err) {
    console.error("[home] getStaticProps failed:", err);
    return { props: { animals: [], fetchError: true }, revalidate: 60 };
  }
};
