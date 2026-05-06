import { getAuthenticatedHeaders } from "@/lib/apiAuth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function fetchPinnedFbPostId(): Promise<string | null> {
  const res = await fetch("/api/settings/pinned-fb-post");
  if (!res.ok) return null;
  const data = await res.json();
  return data.pinnedFbPostId ?? null;
}

export async function setPinnedFbPostId(postId: string | null): Promise<void> {
  const headers = await getAuthenticatedHeaders({ "Content-Type": "application/json" });
  const res = await fetch(`${API_BASE_URL}/api/settings/pinned-fb-post`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ postId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Failed to update pinned FB post");
  }
}
