import AdminHeader from "@/components/Admin/AdminHeader/adminHeader";
import CreateUserForm from "@/components/Admin/CreateUser/createUserForm";
import { useAuthRequired } from "@/lib/useAuthRequired";

export default function CreateUserPage() {
  const { isLoading } = useAuthRequired();

  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      <AdminHeader />
      <CreateUserForm />
    </>
  );
}
