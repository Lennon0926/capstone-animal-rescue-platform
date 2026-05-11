import http from "http";
import type { IncomingMessage, ServerResponse } from "http";
import { MOCK_ANIMALS, MOCK_MEDICAL_RECORDS_BY_AID, MOCK_POSTS } from "./fixtures/testData";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MEDICAL_RECORD_CREATE_FAILED_CODE = "MEDICAL_RECORD_CREATE_FAILED";

// Baseline catalog used by read endpoints. Keep this stable so parallel tests do not
// interfere with each other when create/update/delete flows run in other suites.
const BASE_ANIMALS = MOCK_ANIMALS.map((a) => ({ ...a }));
let ANIMALS = BASE_ANIMALS.map((a) => ({ ...a }));
let CREATED_ANIMALS = new Map<number, (typeof MOCK_ANIMALS)[number]>();

const BASE_POSTS = MOCK_POSTS.map((p) => ({ ...p }));
let POSTS = BASE_POSTS.map((p) => ({ ...p }));
function nextPostId() { return Math.max(...POSTS.map((p) => p.pid), 0) + 1; }
const cloneMedicalRecords = () =>
  new Map(
    Object.entries(MOCK_MEDICAL_RECORDS_BY_AID).map(([aid, records]) => [
      Number(aid),
      records.map((record) => ({ ...record })),
    ])
  );
let MEDICAL_RECORDS_BY_ANIMAL = cloneMedicalRecords();

function nextMedicalRecordId() {
  const recordIds = Array.from(MEDICAL_RECORDS_BY_ANIMAL.values()).flat().map((record) => record.record_id);
  return Math.max(...recordIds, 100) + 1;
}

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
    MEDICAL_RECORDS_BY_ANIMAL = cloneMedicalRecords();
    POSTS = BASE_POSTS.map((p) => ({ ...p }));
    res.writeHead(200);
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // ── Posts endpoints ────────────────────────────────────────────────────────

  // Single post: /api/posts/:pid
  const singlePostMatch = url.match(/^\/api\/posts\/(\d+)$/);
  if (singlePostMatch) {
    const pid = parseInt(singlePostMatch[1], 10);
    const post = POSTS.find((p) => p.pid === pid);

    if (method === "GET") {
      if (!post) { res.writeHead(404); res.end(JSON.stringify({ success: false, error: "Post not found" })); return; }
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: post }));
      return;
    }

    if (method === "PATCH") {
      if (!post) { res.writeHead(404); res.end(JSON.stringify({ success: false, error: "Post not found" })); return; }
      const body = await readBody(req);
      const updates = JSON.parse(body);
      const { remove_image, ...rest } = updates;
      if (updates.is_pinned === true) {
        POSTS = POSTS.map((p) => ({ ...p, is_pinned: p.pid === pid ? true : false }));
      }
      const imageFields = remove_image ? { image_url: null, image_object_key: null } : {};
      POSTS = POSTS.map((p) => p.pid === pid ? { ...p, ...rest, ...imageFields } : p);
      const updated = POSTS.find((p) => p.pid === pid)!;
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: updated }));
      return;
    }

    if (method === "DELETE") {
      if (!post) { res.writeHead(404); res.end(JSON.stringify({ success: false, error: "Post not found" })); return; }
      const deleted = { ...post };
      POSTS = POSTS.filter((p) => p.pid !== pid);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: deleted }));
      return;
    }
  }

  // Post upload: POST /api/uploads/posts/:pid/image
  const postUploadMatch = url.match(/^\/api\/uploads\/posts\/([^/]+)\/image$/);
  if (postUploadMatch && method === "POST") {
    const pid = postUploadMatch[1];
    res.writeHead(200);
    res.end(JSON.stringify({
      data: {
        objectKey: `posts/${pid}/image.jpg`,
        url: `https://test-bucket.r2.dev/posts/${pid}/image.jpg`,
        urlType: "public",
        contentType: "image/jpeg",
        size: 12345,
      },
    }));
    return;
  }

  // Posts list: GET /api/posts
  if (method === "GET" && url.startsWith("/api/posts")) {
    const sorted = [...POSTS].sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      data: sorted,
      pagination: { total: sorted.length, limit: 100, offset: 0, hasMore: false },
    }));
    return;
  }

  // POST /api/posts (create)
  if (method === "POST" && url === "/api/posts") {
    const body = await readBody(req);
    const payload = JSON.parse(body);
    const now = new Date().toISOString();
    if (payload.is_pinned) {
      POSTS = POSTS.map((p) => ({ ...p, is_pinned: false }));
    }
    const newPost = { pid: nextPostId(), is_pinned: false, image_url: null, image_object_key: null, created_at: now, updated_at: now, ...payload };
    POSTS.push(newPost);
    res.writeHead(201);
    res.end(JSON.stringify({ success: true, data: newPost }));
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
          maxImageSizeBytes: MAX_IMAGE_SIZE_BYTES,
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
        res.end(
          JSON.stringify({
            success: true,
            data: {
              ...animal,
              medical_records: MEDICAL_RECORDS_BY_ANIMAL.get(id) || [],
            },
          })
        );
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

      const { medical_records, ...animalUpdates } = updates;
      const updatedAnimal = { ...animal, ...animalUpdates };
      if (createdAnimal) {
        CREATED_ANIMALS.set(id, updatedAnimal);
      } else {
        ANIMALS = ANIMALS.map((currentAnimal) =>
          currentAnimal.aid === id ? updatedAnimal : currentAnimal
        );
      }

      if (Array.isArray(medical_records)) {
        let nextRecordIdValue = nextMedicalRecordId();
        const nextMedicalRecords = medical_records
          .filter((medicalRecord: Record<string, unknown>) =>
            Object.entries(medicalRecord).some(
              ([key, value]) =>
                key !== "record_id" &&
                (value === null ||
                  (typeof value === "string" && value.trim() !== ""))
            )
          )
          .map((medicalRecord: Record<string, unknown>) => {
            const recordId =
              typeof medicalRecord.record_id === "number"
                ? medicalRecord.record_id
                : nextRecordIdValue++;

            return {
              record_id: recordId,
              aid: id,
              record_type:
                typeof medicalRecord.record_type === "string"
                  ? medicalRecord.record_type
                  : "",
              date_given:
                typeof medicalRecord.date_given === "string"
                  ? medicalRecord.date_given
                  : medicalRecord.date_given === null
                    ? null
                    : undefined,
              vet_name:
                typeof medicalRecord.vet_name === "string"
                  ? medicalRecord.vet_name
                  : medicalRecord.vet_name === null
                    ? null
                    : undefined,
              notes:
                typeof medicalRecord.notes === "string"
                  ? medicalRecord.notes
                  : medicalRecord.notes === null
                    ? null
                    : undefined,
              created_at: "2026-04-14T10:00:00.000Z",
            };
          });

        MEDICAL_RECORDS_BY_ANIMAL.set(id, nextMedicalRecords);
      }

      res.writeHead(200);
      res.end(
        JSON.stringify({
          success: true,
          data: {
            ...updatedAnimal,
            medical_records: MEDICAL_RECORDS_BY_ANIMAL.get(id) || [],
          },
        })
      );
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
      const medicalRecords = Array.isArray(data.medical_records)
        ? data.medical_records.filter((medicalRecord: Record<string, unknown>) =>
            Object.values(medicalRecord).some(
              (value) => typeof value === "string" && value.trim() !== ""
            )
          )
        : data.medical_record
          ? [data.medical_record]
          : [];
      const { medical_records, medical_record, ...animalInput } = data;
      const nextAid =
        Math.max(
          ...ANIMALS.map((a) => a.aid),
          ...Array.from(CREATED_ANIMALS.keys()),
          0
        ) + 1;
      void medical_records;
      void medical_record;
      const failedMedicalRecordIndexes = medicalRecords
        .map((medicalRecord: { notes?: string }, index: number) =>
          medicalRecord.notes === "FORCE_MEDICAL_FAILURE" ? index : -1
        )
        .filter((index: number) => index >= 0);
      const medicalRecordsCreatedCount =
        medicalRecords.length - failedMedicalRecordIndexes.length;
      const newAnimal = {
        aid: nextAid,
        ...animalInput,
        tags: animalInput.tags || [],
        created_at: new Date().toISOString(),
        record_id: null as number | null,
      };
      const createdMedicalRecords = medicalRecords
        .filter(
          (_medicalRecord: Record<string, unknown>, index: number) =>
            !failedMedicalRecordIndexes.includes(index)
        )
        .map((medicalRecord: Record<string, unknown>, index: number) => ({
          record_id: nextMedicalRecordId() + index,
          aid: nextAid,
          record_type:
            typeof medicalRecord.record_type === "string"
              ? medicalRecord.record_type
              : "",
          date_given:
            typeof medicalRecord.date_given === "string"
              ? medicalRecord.date_given
              : undefined,
          vet_name:
            typeof medicalRecord.vet_name === "string"
              ? medicalRecord.vet_name
              : undefined,
          notes:
            typeof medicalRecord.notes === "string"
              ? medicalRecord.notes
              : undefined,
          created_at: new Date().toISOString(),
        })
      );
      CREATED_ANIMALS.set(newAnimal.aid, newAnimal);
      MEDICAL_RECORDS_BY_ANIMAL.set(newAnimal.aid, createdMedicalRecords);
      res.writeHead(201);
      res.end(
        JSON.stringify({
          success: true,
          data: {
            ...newAnimal,
            medical_records: createdMedicalRecords,
          },
          medicalRecordsAttempted: medicalRecords.length > 0,
          medicalRecordsRequested: medicalRecords.length,
          medicalRecordsCreatedCount,
          medicalRecordCreated:
            medicalRecords.length > 0 &&
            medicalRecordsCreatedCount === medicalRecords.length,
          ...(failedMedicalRecordIndexes.length > 0
            ? {
                warnings: failedMedicalRecordIndexes.map((index: number) => ({
                  code: MEDICAL_RECORD_CREATE_FAILED_CODE,
                  index,
                  message: `Animal created, but initial medical record ${index + 1} could not be created.`,
                })),
              }
            : {}),
        })
      );
      return;
    }

    // GET list
    res.writeHead(200);
    res.end(
      JSON.stringify({
        success: true,
        data: ANIMALS.map((animal) => ({
          ...animal,
          medical_records: MEDICAL_RECORDS_BY_ANIMAL.get(animal.aid) || [],
        })),
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
