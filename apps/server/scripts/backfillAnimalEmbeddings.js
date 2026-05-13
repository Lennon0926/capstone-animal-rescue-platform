/**
 * Backfill Script: animal tag embeddings
 *
 * Walks every animal in the catalog and persists the 384-dim
 * paraphrase-multilingual-MiniLM-L12-v2 embedding of its tags into the
 * `animal_embedding` pgvector column. Skips rows whose tags are empty
 * (column stays NULL — the matcher treats missing embeddings as neutral).
 *
 * Usage:
 *   node scripts/backfillAnimalEmbeddings.js          # only fills rows with no embedding yet
 *   node scripts/backfillAnimalEmbeddings.js --force  # re-embeds every row
 */

const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "..", ".env.local"),
  quiet: true,
});

const { getSupabaseClient } = require("../lib/supabase");
const {
  generateTagEmbedding,
  serializeEmbedding,
} = require("../services/petMatchService");

const FORCE = process.argv.includes("--force");

async function main() {
  const client = getSupabaseClient();

  const { data: animals, error } = await client
    .from("animals")
    .select("aid, name, tags, animal_embedding");

  if (error) {
    console.error("[backfill] failed to load animals:", error.message);
    process.exit(1);
  }

  console.log(
    `[backfill] loaded ${animals.length} animals (force=${FORCE})`,
  );

  let updated = 0;
  let skipped = 0;
  let cleared = 0;
  let failed = 0;

  for (const animal of animals) {
    const hasTags = Array.isArray(animal.tags) && animal.tags.length > 0;
    const hasEmbedding = Boolean(animal.animal_embedding);

    if (!hasTags) {
      // No tags — ensure the column is NULL (nothing to embed).
      if (hasEmbedding) {
        const { error: clearErr } = await client
          .from("animals")
          .update({ animal_embedding: null })
          .eq("aid", animal.aid);
        if (clearErr) {
          failed += 1;
          console.error(
            `[backfill] failed to clear aid=${animal.aid}:`,
            clearErr.message,
          );
        } else {
          cleared += 1;
          console.log(`[backfill] cleared aid=${animal.aid} (${animal.name})`);
        }
      } else {
        skipped += 1;
      }
      continue;
    }

    if (hasEmbedding && !FORCE) {
      skipped += 1;
      continue;
    }

    try {
      const vector = await generateTagEmbedding(animal);
      if (!vector) {
        skipped += 1;
        continue;
      }
      const { error: writeErr } = await client
        .from("animals")
        .update({ animal_embedding: serializeEmbedding(vector) })
        .eq("aid", animal.aid);
      if (writeErr) {
        failed += 1;
        console.error(
          `[backfill] failed aid=${animal.aid}:`,
          writeErr.message,
        );
      } else {
        updated += 1;
        console.log(
          `[backfill] embedded aid=${animal.aid} (${animal.name}) tags=${JSON.stringify(animal.tags)}`,
        );
      }
    } catch (err) {
      failed += 1;
      console.error(`[backfill] error aid=${animal.aid}:`, err.message);
    }
  }

  console.log(
    `[backfill] done. updated=${updated} cleared=${cleared} skipped=${skipped} failed=${failed}`,
  );
  process.exit(failed === 0 ? 0 : 1);
}

main();
