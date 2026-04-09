import AdminHeader from "@/components/Admin/AdminHeader/adminHeader";
import AdminHome from "@/components/Admin/AdminHome/adminHome";
import { useAuthRequired } from "@/lib/useAuthRequired";

export default function AdminHomePage() {
  const { isLoading } = useAuthRequired();

  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      <AdminHeader />
      <AdminHome />
    </>
  );
}