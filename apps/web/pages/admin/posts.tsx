import { GetServerSideProps } from "next";
import AdminHeader from "@/components/Admin/AdminHeader/adminHeader";
import AdminPostsList from "@/components/Admin/AdminPostsList/adminPostsList";
import { useAuthRequired } from "@/lib/useAuthRequired";
import type { Post } from "@/types/post";

type ApiResponse = {
  success: boolean;
  data: Post[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
};

type AdminPostsPageProps = {
  posts: Post[];
};

export default function AdminPostsPage({ posts }: AdminPostsPageProps) {
  const { isLoading } = useAuthRequired();
  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      <AdminHeader />
      <AdminPostsList initialPosts={posts} />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/posts?limit=100`
    );

    if (!res.ok) {
      return { props: { posts: [] } };
    }

    const result: ApiResponse = await res.json();

    if (!result.success || !result.data) {
      return { props: { posts: [] } };
    }

    return { props: { posts: result.data } };
  } catch (err) {
    console.error("[admin/posts] getServerSideProps failed:", err);
    return { props: { posts: [] } };
  }
};
