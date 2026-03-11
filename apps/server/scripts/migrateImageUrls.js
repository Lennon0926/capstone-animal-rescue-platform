/**
 * Migration Script: Fix broken image_url values in the animals table.
 *
 * Handles two cases:
 *  1. Plain objectKey  — e.g. "animals/14/file.png" (no protocol)
 *  2. Expired signed URL — e.g. "https://account.r2.cloudflarestorage.com/animals/2/file.jpeg?X-Amz-..."
 *
 * Both are rewritten to the public R2 URL using R2_PUBLIC_BASE_URL.
 *
 * Usage:
 *   node scripts/migrateImageUrls.js          # dry-run (prints changes, writes nothing)
 *   node scripts/migrateImageUrls.js --apply  # applies the updates to the DB
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env.local") });

const { getSupabaseClient } = require("../lib/supabase");

const R2_PUBLIC_BASE_URL = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/+$/, "");
const DRY_RUN = !process.argv.includes("--apply");

if (!R2_PUBLIC_BASE_URL) {
  console.error("ERROR: R2_PUBLIC_BASE_URL is not set in .env.local");
  process.exit(1);
}

/**
 * Extracts the R2 object key from a broken image_url value.
 * Returns null if the URL is already a valid public URL.
 */
function extractObjectKey(imageUrl) {
  if (!imageUrl || imageUrl.trim() === "") return null;

  // Case 1: expired signed URL from r2.cloudflarestorage.com
  if (imageUrl.includes("r2.cloudflarestorage.com") && imageUrl.includes("X-Amz-")) {
    try {
      const url = new URL(imageUrl);
      return url.pathname.replace(/^\//, "");
    } catch {
      return null;
    }
  }

  // Case 2: plain objectKey (no protocol prefix)
  if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
    return imageUrl.replace(/^\//, "");
  }

  // Already a valid absolute URL — no fix needed
  return null;
}

async function run() {
  const supabase = getSupabaseClient();

  const { data: animals, error } = await supabase
    .from("animals")
    .select("aid, name, image_url");

  if (error) {
    console.error("Failed to fetch animals:", error.message);
    process.exit(1);
  }

  const toFix = animals
    .map((animal) => {
      const objectKey = extractObjectKey(animal.image_url);
      if (!objectKey) return null;
      return {
        aid: animal.aid,
        name: animal.name,
        oldUrl: animal.image_url,
        newUrl: `${R2_PUBLIC_BASE_URL}/${objectKey}`,
      };
    })
    .filter(Boolean);

  if (toFix.length === 0) {
    console.log("No broken image URLs found. Nothing to do.");
    return;
  }

  console.log(`Found ${toFix.length} animal(s) with broken image URLs:\n`);
  for (const item of toFix) {
    console.log(`  [aid=${item.aid}] ${item.name}`);
    console.log(`    OLD: ${item.oldUrl}`);
    console.log(`    NEW: ${item.newUrl}`);
    console.log();
  }

  if (DRY_RUN) {
    console.log("Dry-run mode — no changes written. Re-run with --apply to update the DB.");
    return;
  }

  console.log("Applying updates...\n");
  let successCount = 0;
  let failCount = 0;

  for (const item of toFix) {
    const { error: updateError } = await supabase
      .from("animals")
      .update({ image_url: item.newUrl })
      .eq("aid", item.aid);

    if (updateError) {
      console.error(`  FAILED [aid=${item.aid}]: ${updateError.message}`);
      failCount++;
    } else {
      console.log(`  UPDATED [aid=${item.aid}] ${item.name}`);
      successCount++;
    }
  }

  console.log(`\nDone. ${successCount} updated, ${failCount} failed.`);
}

run().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
