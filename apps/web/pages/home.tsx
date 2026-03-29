import type { GetServerSideProps } from "next";
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

export const getServerSideProps: GetServerSideProps<HomeProps> = async ({
  res,
}) => {
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=300"
  );

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/animals?status=disponible&limit=3&sortBy=created_at&sortOrder=asc`
    );

    if (!response.ok) {
      return {
        props: {
          animals: [],
          fetchError: true,
        },
      };
    }

    const result: ApiResponse = await response.json();

    if (!result.success || !result.data) {
      return {
        props: {
          animals: [],
          fetchError: true,
        },
      };
    }

    return {
      props: {
        animals: result.data,
      },
    };
  } catch (err) {
    console.error("[home] getServerSideProps failed:", err);
    return {
      props: {
        animals: [],
        fetchError: true,
      },
    };
  }
};
