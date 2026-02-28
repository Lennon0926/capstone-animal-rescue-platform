import HeaderSeccion from "@/components/LandingPage/Header/headerSection";
import DonationSection from "@/components/LandingPage/Donate/donationSection";
import OurMissionSeccion from "@/components/LandingPage/Mission/ourMissionSection";
import AnimalsSection from "@/components/LandingPage/Animals/animalsSection";

function Index() {
  return (
    <div>
      <HeaderSeccion />
      <DonationSection />
      <OurMissionSeccion />
      <AnimalsSection />
    </div>
  );
}

export default Index;
