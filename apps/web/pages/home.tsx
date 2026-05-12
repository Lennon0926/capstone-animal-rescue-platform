import type { GetServerSideProps } from "next";
import Head from "next/head";
import HeaderSection from "@/components/Header/headerSection";
import HeroSection from "@/components/LandingPage/Hero/heroSection";
import MissionVideoSection from "@/components/LandingPage/MissionVideo/missionVideoSection";
import TimelineSection from "@/components/LandingPage/Timeline/timelineSection";
import StoriesSection from "@/components/LandingPage/Stories/storiesSection";
import GetInvolvedSection from "@/components/LandingPage/GetInvolved/getInvolvedSection";
import VolunteerIntakeSection from "@/components/LandingPage/VolunteerIntake/volunteerIntakeSection";
import AnimalsSection from "@/components/LandingPage/Animals/animalsSection";
import DonationBanner from "@/components/LandingPage/Donate/donationBanner";
import ContactSection from "@/components/LandingPage/Contact/contactSection";
import FooterSection from "@/components/Footer/footerSection";
import type { Animal } from "@/types/animal";
import styles from "./home.module.css";

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
    <div className={styles.page}>
      <Head>
        <title>Inicio | Huellitas Sin Hogar</title>
        <meta name="description" content="Huellitas Sin Hogar — adopta, dona y apoya a los animales sin hogar de Aguadilla, Puerto Rico." />
      </Head>
      <HeaderSection revealOnFirstScroll />
      <HeroSection />
      <MissionVideoSection />
      <TimelineSection />
      <StoriesSection />
      <GetInvolvedSection />
      <VolunteerIntakeSection />
      <AnimalsSection animals={animals} fetchError={fetchError} />
      <DonationBanner />
      <ContactSection />
      <FooterSection />
    </div>
  );
}

export default Home;

export const getServerSideProps: GetServerSideProps<HomeProps> = async ({ res }) => {
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/animals?status=disponible&limit=3&sortBy=created_at&sortOrder=asc`
    );

    if (!response.ok) {
      return { props: { animals: [], fetchError: true } };
    }

    const result: ApiResponse = await response.json();

    if (!result.success || !result.data) {
      return { props: { animals: [], fetchError: true } };
    }

    return { props: { animals: result.data } };
  } catch (err) {
    console.error("[home] getServerSideProps failed:", err);
    return { props: { animals: [], fetchError: true } };
  }
};
