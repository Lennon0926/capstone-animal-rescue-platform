import type { NextApiRequest, NextApiResponse } from "next";
import ExcelJS from "exceljs";
import { createClient } from "@supabase/supabase-js";

const ANIMAL_COLUMNS = [
  "ID", "Nombre", "Descripción", "Especie", "Género",
  "Tamaño", "Estado", "Creado en", "Etiquetas",
  "Microchip ID", "Esterilizado", "Edad estimada",
];

const RECORD_COLUMNS = [
  "Animal ID", "Animal", "Record ID", "Tipo",
  "Fecha", "Veterinario", "Notas", "Creado en",
];

function toDateStr(val: unknown): string {
  if (!val || typeof val !== "string") return "";
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("es-PR");
}

async function fetchAllAnimals(base: string): Promise<Record<string, unknown>[]> {
  const all: Record<string, unknown>[] = [];
  const PAGE = 100;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const res = await fetch(
      `${base}/api/animals?limit=${PAGE}&offset=${offset}`,
    );
    if (!res.ok) break;
    const json: { success: boolean; data: Record<string, unknown>[]; pagination?: { hasMore: boolean } } =
      await res.json();
    if (!json.success || !json.data) break;
    all.push(...json.data);
    hasMore = json.pagination?.hasMore ?? false;
    offset += PAGE;
  }

  return all;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Auth check
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.slice(7);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) {
    return res.status(500).json({ error: "API base URL not configured" });
  }

  try {
    const [animals, recordsRes] = await Promise.all([
      fetchAllAnimals(base),
      fetch(`${base}/api/animals/records`, {
        headers: { Authorization: authHeader },
      }),
    ]);

    if (!recordsRes.ok) {
      return res.status(502).json({ error: "Failed to fetch medical records" });
    }
    const recordsJson: { success: boolean; data: Record<string, unknown>[] } =
      await recordsRes.json();
    if (!recordsJson.success) {
      return res.status(502).json({ error: "Failed to fetch medical records" });
    }
    const records = recordsJson.data ?? [];

    const workbook = new ExcelJS.Workbook();
    const animalsSheet = workbook.addWorksheet("Animales");
    const recordsSheet = workbook.addWorksheet("Registros Médicos");

    animalsSheet.columns = ANIMAL_COLUMNS.map((key) => ({ header: key, key }));
    animals.forEach((a) =>
      animalsSheet.addRow({
        "ID": a.aid,
        "Nombre": a.name,
        "Descripción": a.description,
        "Especie": a.species,
        "Género": a.gender,
        "Tamaño": a.size,
        "Estado": a.status,
        "Creado en": toDateStr(a.created_at),
        "Etiquetas": Array.isArray(a.tags) ? a.tags.join(", ") : "",
        "Microchip ID": a.microchip_id ?? "",
        "Esterilizado": a.is_sterilized ? "Sí" : "No",
        "Edad estimada": a.estimated_age ?? "",
      }),
    );

    recordsSheet.columns = RECORD_COLUMNS.map((key) => ({ header: key, key }));
    records.forEach((r) =>
      recordsSheet.addRow({
        "Animal ID": r.aid ?? "",
        "Animal": r.animal_name ?? r.name ?? "",
        "Record ID": r.record_id ?? "",
        "Tipo": r.record_type ?? "",
        "Fecha": toDateStr(r.date_given),
        "Veterinario": r.vet_name ?? "",
        "Notas": r.notes ?? "",
        "Creado en": toDateStr(r.created_at),
      }),
    );

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", 'attachment; filename="animales.xlsx"');
    res.setHeader("Cache-Control", "private, no-store");
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("[api/export/animals]", err);
    res.status(500).json({ error: "Export failed" });
  }
}
