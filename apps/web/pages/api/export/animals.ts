import type { NextApiRequest, NextApiResponse } from "next";
import ExcelJS from "exceljs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL;

    const [animalsRes, recordsRes] = await Promise.all([
      fetch(`${base}/api/animals?limit=1000`),
      fetch(`${base}/api/animals/records`),
    ]);

    const animalsJson = animalsRes.ok ? await animalsRes.json() : { data: [] };
    const recordsJson = recordsRes.ok ? await recordsRes.json() : { data: [] };

    const animals: Record<string, unknown>[] = animalsJson.data ?? [];
    const records: Record<string, unknown>[] = recordsJson.data ?? [];

    const workbook = new ExcelJS.Workbook();
    const animalsSheet = workbook.addWorksheet("Animales");
    const recordsSheet = workbook.addWorksheet("Registros Médicos");

    if (animals.length > 0) {
      const rows = animals.map((a) => ({
        ID: a.aid,
        Nombre: a.name,
        Descripción: a.description,
        Especie: a.species,
        Género: a.gender,
        Tamaño: a.size,
        Estado: a.status,
        "Creado en": a.created_at
          ? new Date(a.created_at as string).toLocaleDateString("es-PR")
          : "",
        Etiquetas: Array.isArray(a.tags) ? a.tags.join(", ") : "",
        "Microchip ID": a.microchip_id ?? "",
        Esterilizado: a.is_sterilized ? "Sí" : "No",
        "Edad estimada": a.estimated_age ?? "",
      }));
      animalsSheet.columns = Object.keys(rows[0]).map((key) => ({
        header: key,
        key,
      }));
      rows.forEach((row) => animalsSheet.addRow(row));
    }

    if (records.length > 0) {
      const rows = records.map((r) => ({
        "Animal ID": r.aid ?? "",
        Animal: r.animal_name ?? r.name ?? "",
        "Record ID": r.record_id ?? "",
        Tipo: r.record_type ?? "",
        Fecha: r.date_given
          ? new Date(r.date_given as string).toLocaleDateString("es-PR")
          : "",
        Veterinario: r.vet_name ?? "",
        Notas: r.notes ?? "",
        "Creado en": r.created_at
          ? new Date(r.created_at as string).toLocaleDateString("es-PR")
          : "",
      }));
      recordsSheet.columns = Object.keys(rows[0]).map((key) => ({
        header: key,
        key,
      }));
      rows.forEach((row) => recordsSheet.addRow(row));
    }

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="animales.xlsx"',
    );
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("[api/export/animals]", err);
    res.status(500).json({ error: "Export failed" });
  }
}
