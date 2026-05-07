import type { Post } from "@/types/post";
import { getAuthenticatedHeaders } from "@/lib/apiAuth";
import { compressIfNeeded } from "@/lib/imageCompressor";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // keep in sync with server R2_MAX_IMAGE_SIZE_BYTES

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const getApiBaseUrl = () => {
  if (!API_BASE_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is not defined. Set it in apps/web/.env.local."
    );
  }
  return API_BASE_URL;
};

type PostsListResponse = {
  success: boolean;
  data?: Post[];
  pagination?: { total: number; limit: number; offset: number; hasMore: boolean };
};

type PostResponse = {
  success: boolean;
  data?: Post;
  error?: { message?: string } | string;
};

type UploadResult = {
  objectKey: string;
  url: string;
  urlType: "public";
  contentType: string;
  size: number;
};

type UploadApiResponse = {
  data?: UploadResult;
  error?: { code?: string; message?: string };
};

export async function fetchPosts(): Promise<Post[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/posts?limit=100`);
  const payload: PostsListResponse = await response.json();
  if (!response.ok || !payload.success) throw new Error("Failed to fetch posts.");
  return payload.data || [];
}

export async function fetchPost(pid: number): Promise<Post> {
  const response = await fetch(`${getApiBaseUrl()}/api/posts/${pid}`);
  const payload: PostResponse = await response.json();
  if (!response.ok || !payload.success || !payload.data) throw new Error("Failed to fetch post.");
  return payload.data;
}

export async function createPost(
  payload: { header: string; body: string; is_pinned?: boolean; image_object_key?: string }
): Promise<Post> {
  const response = await fetch(`${getApiBaseUrl()}/api/posts`, {
    method: "POST",
    headers: await getAuthenticatedHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  const data: PostResponse = await response.json();
  if (!response.ok || !data.success || !data.data) {
    const msg = typeof data.error === "string" ? data.error : data.error?.message;
    throw new Error(msg || "Failed to create post.");
  }
  return data.data;
}

export async function updatePost(
  pid: number,
  payload: Partial<{ header: string; body: string; is_pinned: boolean; image_object_key: string }>
): Promise<Post> {
  const response = await fetch(`${getApiBaseUrl()}/api/posts/${pid}`, {
    method: "PATCH",
    headers: await getAuthenticatedHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  const data: PostResponse = await response.json();
  if (!response.ok || !data.success || !data.data) {
    const msg = typeof data.error === "string" ? data.error : data.error?.message;
    throw new Error(msg || "Failed to update post.");
  }
  return data.data;
}

export async function deletePost(pid: number): Promise<Post> {
  const response = await fetch(`${getApiBaseUrl()}/api/posts/${pid}`, {
    method: "DELETE",
    headers: await getAuthenticatedHeaders(),
  });
  const data: PostResponse = await response.json();
  if (!response.ok || !data.success || !data.data) {
    const msg = typeof data.error === "string" ? data.error : data.error?.message;
    throw new Error(msg || "Failed to delete post.");
  }
  return data.data;
}

export async function uploadPostImage(pid: number, file: File): Promise<UploadResult> {
  const compressed = await compressIfNeeded(file, MAX_UPLOAD_BYTES);
  const formData = new FormData();
  formData.append("image", compressed);

  const response = await fetch(
    `${getApiBaseUrl()}/api/uploads/posts/${encodeURIComponent(String(pid))}/image`,
    {
      method: "POST",
      headers: await getAuthenticatedHeaders(),
      body: formData,
    }
  );

  const payload: UploadApiResponse = await response.json();
  if (!response.ok || !payload.data) {
    throw new Error(payload.error?.message || "Image upload failed.");
  }
  return payload.data;
}

export async function uploadAndUpdatePostImage(
  pid: number,
  file: File
): Promise<{ uploadResult: UploadResult; post: Post }> {
  const uploadResult = await uploadPostImage(pid, file);
  const post = await updatePost(pid, { image_object_key: uploadResult.objectKey });
  return { uploadResult, post };
}
