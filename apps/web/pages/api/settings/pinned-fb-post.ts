import type { NextApiRequest, NextApiResponse } from "next";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!API_BASE_URL) return res.status(500).json({ error: "NEXT_PUBLIC_API_BASE_URL is not configured." });

  try {
    const upstream = await fetch(`${API_BASE_URL}/api/settings/pinned-fb-post`);
    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch {
    return res.status(502).json({ pinnedFbPostId: null });
  }
}
