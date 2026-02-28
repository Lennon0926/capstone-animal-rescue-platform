import HeaderSeccion from "@/components/LandingPage/Header/headerSeccion";
import DonationSection from "@/components/LandingPage/Donate/donationSeccion";
import OurMissionSeccion from "@/components/LandingPage/Mission/ourMissionSeccion";
import AnimalsSection from "@/components/LandingPage/Animals/animalsSeccion";

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
