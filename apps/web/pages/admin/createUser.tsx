import AdminHeader from "@/components/Admin/AdminHeader/adminHeader";
import UsersManagement from "@/components/Admin/UsersManagement/usersManagement";
import { useAuthRequired, useAuthRequiredRol } from "@/lib/useAuthRequired";

export default function CreateUserPage() {
  const { isLoading } = useAuthRequired();
  const { isLoadingRole, hasRequiredRole } = useAuthRequiredRol("Administrador");

  if (isLoading) return <div>Loading...</div>;
  if (isLoadingRole) return <div></div>;
  if (!hasRequiredRole) return null;

  return (
    <>
      <AdminHeader />
      <UsersManagement />
    </>
  );
}
