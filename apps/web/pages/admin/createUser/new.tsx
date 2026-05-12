import AdminHeader from "@/components/Admin/AdminHeader/adminHeader";
import CreateUserForm from "@/components/Admin/CreateUser/createUserForm";
import { useAuthRequired, useAuthRequiredRol } from "@/lib/useAuthRequired";

export default function NewUserPage() {
  const { isLoading } = useAuthRequired();
  const { isLoadingRole, hasRequiredRole } = useAuthRequiredRol("Administrador");

  if (isLoading) return <div>Loading...</div>;
  if (isLoadingRole) return <div>Checking permissions...</div>;
  if (!hasRequiredRole) return null;

  return (
    <>
      <AdminHeader />
      <CreateUserForm />
    </>
  );
}
