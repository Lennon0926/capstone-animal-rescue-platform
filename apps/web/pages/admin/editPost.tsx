import { GetServerSideProps } from "next";
import AdminHeader from "@/components/Admin/AdminHeader/adminHeader";
import EditPostForm from "@/components/Admin/EditPost/editPostForm";
import { useAuthRequired } from "@/lib/useAuthRequired";
import type { Post } from "@/types/post";

type ApiResponse = { success: boolean; data: Post };
type EditPostPageProps = { post?: Post | null; error?: string; notFound?: boolean };

export default function EditPostPage({ post, error, notFound }: EditPostPageProps) {
  const { isLoading } = useAuthRequired();
  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      <AdminHeader />
      <EditPostForm post={post ?? undefined} error={error} notFound={notFound} />
    </>
  );
}

export const getServerSideProps: GetServerSideProps<EditPostPageProps> = async (context) => {
  const { id } = context.query;

  if (!id) {
    return { props: { error: "Post ID is required." } };
  }

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/posts/${id}`
    );

    if (res.status === 404) {
      return { props: { notFound: true } };
    }

    if (!res.ok) {
      return { props: { error: "Error al cargar la publicación." } };
    }

    const result: ApiResponse = await res.json();

    if (!result.success || !result.data) {
      return { props: { error: "No se pudo cargar la publicación." } };
    }

    return { props: { post: result.data } };
  } catch (err) {
    console.error("[admin/editPost] getServerSideProps failed:", err);
    return { props: { error: "Error al cargar la publicación." } };
  }
};
