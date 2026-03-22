import http from "http";
import type { IncomingMessage, ServerResponse } from "http";
import { MOCK_ANIMALS } from "./fixtures/testData";

const ANIMALS = MOCK_ANIMALS;

function handleRequest(req: IncomingMessage, res: ServerResponse) {
  const url = req.url ?? "";

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Single animal: /api/animals/1  (valid)
  const singleMatch = url.match(/^\/api\/animals\/(\d+)$/);
  if (singleMatch) {
    const id = parseInt(singleMatch[1], 10);
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

  // Animals list: /api/animals?...
  if (url.startsWith("/api/animals")) {
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
  const server = http.createServer(handleRequest);

  await new Promise<void>((resolve) => {
    server.listen(4001, resolve);
  });

  return async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  };
}
