import type { NextApiRequest, NextApiResponse } from "next";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!API_BASE_URL) {
    return res.status(500).json({ error: "NEXT_PUBLIC_API_BASE_URL is not configured." });
  }

  const { limit = "100", offset = "0" } = req.query;

  try {
    const upstream = await fetch(
      `${API_BASE_URL}/api/posts?limit=${limit}&offset=${offset}`
    );

    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (err) {
    console.error("[api/posts] proxy failed:", err);
    return res.status(502).json({ error: "Failed to fetch posts from backend." });
  }
}
