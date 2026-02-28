import HeaderSeccion from "@/components/LandingPage/Header/headerSection";
import DonationSection from "@/components/LandingPage/Donate/donationSection";
import OurMissionSeccion from "@/components/LandingPage/Mission/ourMissionSection";
import AnimalsSection from "@/components/LandingPage/Animals/animalsSection";
import HowItWorks from "@/components/LandingPage/HowItWorks/howItWorksSection";
import DonationBanner from "@/components/LandingPage/Donate/donationBanner";
import FooterSection from "@/components/LandingPage/Footer/footerSection";

function Index() {
  return (
    <div>
      <HeaderSeccion />
      <DonationSection />
      <OurMissionSeccion />
      <AnimalsSection />
      <HowItWorks />
      <DonationBanner />
      <FooterSection />
    </div>
  );
}

export default Index;
