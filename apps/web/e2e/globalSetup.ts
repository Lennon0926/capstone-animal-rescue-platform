import http from "http";
import type { IncomingMessage, ServerResponse } from "http";
import { MOCK_ANIMALS } from "./fixtures/testData";

// Baseline catalog used by read endpoints. Keep this stable so parallel tests do not
// interfere with each other when create/update/delete flows run in other suites.
const BASE_ANIMALS = MOCK_ANIMALS.map((a) => ({ ...a }));
let ANIMALS = BASE_ANIMALS.map((a) => ({ ...a }));
let CREATED_ANIMALS = new Map<number, (typeof MOCK_ANIMALS)[number]>();

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
    ANIMALS = BASE_ANIMALS.map((a) => ({ ...a }));
    CREATED_ANIMALS = new Map();
    res.writeHead(200);
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // Upload config health: GET /api/uploads/config
  if (method === "GET" && url === "/api/uploads/config") {
    res.writeHead(200);
    res.end(
      JSON.stringify({
        data: {
          r2Configured: true,
          missingEnvVars: [],
          publicObjectUrlConfigured: true,
          missingPublicObjectUrlEnvVars: [],
          allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
          maxImageSizeBytes: 5 * 1024 * 1024,
          health: {
            ok: true,
            code: "OK",
            message: "Mock upload storage is healthy.",
            checkedAt: "2024-01-01T00:00:00.000Z",
          },
        },
      })
    );
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
    const baselineAnimal = ANIMALS.find((a) => a.aid === id);
    const createdAnimal = CREATED_ANIMALS.get(id);
    const animal = createdAnimal ?? baselineAnimal;

    if (method === "GET") {
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
      if (!animal) {
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, error: "Not found" }));
        return;
      }

      const updatedAnimal = { ...animal, ...updates };
      if (createdAnimal) {
        CREATED_ANIMALS.set(id, updatedAnimal);
      }

      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: updatedAnimal }));
      return;
    }

    if (method === "DELETE") {
      if (!animal) {
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, error: "Not found" }));
        return;
      }

      if (createdAnimal) {
        CREATED_ANIMALS.delete(id);
      }

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
      const nextAid =
        Math.max(
          ...ANIMALS.map((a) => a.aid),
          ...Array.from(CREATED_ANIMALS.keys()),
          0
        ) + 1;
      const newAnimal = {
        aid: nextAid,
        ...data,
        tags: data.tags || [],
        created_at: new Date().toISOString(),
        record_id: null as number | null,
      };
      CREATED_ANIMALS.set(newAnimal.aid, newAnimal);
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
