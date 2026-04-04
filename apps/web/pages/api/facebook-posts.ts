import type { NextApiRequest, NextApiResponse } from "next";

export interface FacebookComment {
  id: string;
  message: string;
  from?: { name: string; id: string };
  created_time: string;
}

export interface FacebookAttachment {
  type: string;
  media?: { image?: { src: string; width: number; height: number } };
  subattachments?: { data: FacebookAttachment[] };
}

export interface FacebookPost {
  id: string;
  message?: string;
  story?: string;
  full_picture?: string;
  created_time: string;
  permalink_url: string;
  comments?: { data: FacebookComment[] };
  attachments?: { data: FacebookAttachment[] };
}

interface FacebookGraphResponse {
  data: FacebookPost[];
  paging?: {
    cursors: { before: string; after: string };
    next?: string;
  };
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FacebookPost[] | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const pageId = process.env.FB_PAGE_ID;
  const accessToken = process.env.FB_ACCESS_TOKEN;

  if (!pageId || !accessToken) {
    return res
      .status(500)
      .json({ error: "Facebook credentials are not configured" });
  }

  const limit = Number(req.query.limit ?? 12);

  try {
    const fields = "message,story,full_picture,created_time,permalink_url,comments{message,from{name,id},created_time},attachments{type,media,subattachments{type,media}}";
    const url = `https://graph.facebook.com/v21.0/${pageId}/posts?fields=${fields}&limit=${limit}&access_token=${accessToken}`;

    const fbRes = await fetch(url);
    const json: FacebookGraphResponse = await fbRes.json();

    if (!fbRes.ok || json.error) {
      return res
        .status(fbRes.ok ? 502 : fbRes.status)
        .json({ error: json.error?.message ?? "Facebook API error" });
    }

    // Cache 10 minutes at the edge, serve stale for 1 minute while revalidating
    res.setHeader(
      "Cache-Control",
      "s-maxage=600, stale-while-revalidate=60"
    );

    return res.status(200).json(json.data);
  } catch {
    return res.status(500).json({ error: "Failed to fetch Facebook posts" });
  }
}
