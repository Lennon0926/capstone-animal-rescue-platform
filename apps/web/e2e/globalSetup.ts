import http from "http";
import type { IncomingMessage, ServerResponse } from "http";
import { MOCK_ANIMALS } from "./fixtures/testData";

// Mutable copy — CRUD tests mutate this; call POST /test/reset to restore.
let ANIMALS = MOCK_ANIMALS.map((a) => ({ ...a }));

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
  });
}

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  const url = req.url ?? "";
  const method = req.method ?? "GET";

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.writeHead(204);
    res.end();
    return;
  }

  // Reset endpoint for test isolation: POST /test/reset
  if (method === "POST" && url === "/test/reset") {
    ANIMALS = MOCK_ANIMALS.map((a) => ({ ...a }));
    res.writeHead(200);
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // Image upload: POST /api/uploads/animals/:id/image
  const uploadMatch = url.match(/^\/api\/uploads\/animals\/([^/]+)\/image$/);
  if (uploadMatch && method === "POST") {
    res.writeHead(200);
    res.end(
      JSON.stringify({
        data: {
          objectKey: `animals/${uploadMatch[1]}/image`,
          url: `https://test-bucket.r2.dev/animals/${uploadMatch[1]}/image.jpg`,
          urlType: "public",
          contentType: "image/jpeg",
          size: 12345,
        },
      })
    );
    return;
  }

  // Single animal: /api/animals/:id
  const singleMatch = url.match(/^\/api\/animals\/(\d+)$/);
  if (singleMatch) {
    const id = parseInt(singleMatch[1], 10);

    if (method === "GET") {
      const animal = ANIMALS.find((a) => a.aid === id);
      if (animal) {
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, data: animal }));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, message: "Not found" }));
      }
      return;
    }

    if (method === "PATCH") {
      const body = await readBody(req);
      const updates = JSON.parse(body);
      const idx = ANIMALS.findIndex((a) => a.aid === id);
      if (idx === -1) {
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, error: "Not found" }));
        return;
      }
      ANIMALS[idx] = { ...ANIMALS[idx], ...updates };
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: ANIMALS[idx] }));
      return;
    }

    if (method === "DELETE") {
      const idx = ANIMALS.findIndex((a) => a.aid === id);
      if (idx === -1) {
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, error: "Not found" }));
        return;
      }
      ANIMALS.splice(idx, 1);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true }));
      return;
    }
  }

  // Animals list: /api/animals
  if (url.startsWith("/api/animals")) {
    if (method === "POST") {
      const body = await readBody(req);
      const data = JSON.parse(body);
      const newAnimal = {
        aid: Math.max(...ANIMALS.map((a) => a.aid), 0) + 1,
        ...data,
        tags: data.tags || [],
        created_at: new Date().toISOString(),
        record_id: null as number | null,
      };
      ANIMALS.push(newAnimal);
      res.writeHead(201);
      res.end(JSON.stringify({ success: true, data: newAnimal }));
      return;
    }

    // GET list
    res.writeHead(200);
    res.end(
      JSON.stringify({
        success: true,
        data: ANIMALS,
        pagination: {
          total: ANIMALS.length,
          limit: 100,
          offset: 0,
          hasMore: false,
        },
      })
    );
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ success: false }));
}

export default async function globalSetup() {
  const server = http.createServer((req, res) => {
    handleRequest(req, res).catch((err) => {
      console.error("Mock server error:", err);
      res.writeHead(500);
      res.end(JSON.stringify({ success: false, error: "Mock server error" }));
    });
  });

  await new Promise<void>((resolve) => {
    server.listen(4001, resolve);
  });

  return async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  };
}
