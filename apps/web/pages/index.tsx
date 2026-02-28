import HeaderSeccion from "@/components/Header/headerSeccion";
import DonationSection from "@/components/Donate/donationSeccion";
import OurMissionSeccion from "@/components/Mission/ourMissionSeccion";

function Index() {
  return (
    <div>
      <HeaderSeccion />
      <DonationSection />
      <OurMissionSeccion />
    </div>
  );
}

export default Index;
