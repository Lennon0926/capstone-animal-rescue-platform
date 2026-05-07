import { getAuthenticatedHeaders } from "@/lib/apiAuth";

function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined.");
  return url;
}

export async function fetchPinnedFbPostId(): Promise<string | null> {
  const res = await fetch("/api/settings/pinned-fb-post");
  if (!res.ok) return null;
  const data = await res.json();
  return data.pinnedFbPostId ?? null;
}

export async function setPinnedFbPostId(postId: string | null): Promise<void> {
  const headers = await getAuthenticatedHeaders({ "Content-Type": "application/json" });
  const res = await fetch(`${getApiBaseUrl()}/api/settings/pinned-fb-post`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ postId }),
  });
  if (!res.ok) {
    const data: { error?: string | { message?: string } } = await res.json().catch(() => ({}));
    const msg =
      typeof data.error === "string"
        ? data.error
        : data.error?.message ?? "Failed to update pinned FB post";
    throw new Error(msg);
  }
}
