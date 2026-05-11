import AdminHeader from "@/components/Admin/AdminHeader/adminHeader";
import CreatePostForm from "@/components/Admin/CreatePost/createPostForm";
import { useAuthRequired } from "@/lib/useAuthRequired";

export default function CreatePostPage() {
  const { isLoading } = useAuthRequired();
  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      <AdminHeader />
      <CreatePostForm />
    </>
  );
}
