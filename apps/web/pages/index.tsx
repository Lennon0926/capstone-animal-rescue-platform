import HeaderSection from "@/components/Header/headerSection";
import DonationSection from "@/components/LandingPage/Donate/donationSection";
import OurMissionSection from "@/components/LandingPage/Mission/ourMissionSection";
import AnimalsSection from "@/components/LandingPage/Animals/animalsSection";
import HowItWorks from "@/components/LandingPage/HowItWorks/howItWorksSection";
import DonationBanner from "@/components/LandingPage/Donate/donationBanner";
import FooterSection from "@/components/Footer/footerSection";

function Index() {
  return (
    <div>
      <HeaderSection />
      <DonationSection />
      <OurMissionSection />
      <AnimalsSection />
      <HowItWorks />
      <DonationBanner />
      <FooterSection />
    </div>
  );
}

export default Index;
