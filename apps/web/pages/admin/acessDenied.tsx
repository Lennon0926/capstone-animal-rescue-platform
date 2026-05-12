import AccessDeniedScreen from "@/components/Admin/AccessDeniedScreen/accessDenied";
import AdminHeader from "@/components/Admin/AdminHeader/adminHeader";
import { useAuthRequired } from "@/lib/useAuthRequired";

export default function AdminAccessDeniedPage() {
  const { isLoading } = useAuthRequired();

  if (isLoading) return <div>Cargando...</div>;

  return (
    <>
      <AdminHeader />
      <AccessDeniedScreen />
    </>
  );
}
