/**
 * Migration Script: Normalize animal image storage fields.
 *
 * Backfills `image_object_key` from existing R2-backed `image_url` values and
 * recomputes the legacy `image_url` column using R2_PUBLIC_BASE_URL so API
 * consumers continue to receive a stable, renderable URL during transition.
 *
 * Usage:
 *   node scripts/migrateImageUrls.js          # dry-run (prints changes, writes nothing)
 *   node scripts/migrateImageUrls.js --apply  # applies the updates to the DB
 */

const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "..", ".env.local"),
  quiet: true,
});
const { getSupabaseClient } = require("../lib/supabase");
const {
  extractObjectKeyFromImageReference,
  getPublicObjectUrl,
  isPublicObjectUrlConfigured,
  normalizeObjectKey,
} = require("../services/r2Service");

const DRY_RUN = !process.argv.includes("--apply");

function normalizeText(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function buildImageStorageUpdate(animal) {
  const currentImageUrl = normalizeText(animal.image_url);
  const currentImageObjectKey = normalizeObjectKey(animal.image_object_key);
  const derivedImageObjectKey =
    currentImageObjectKey || extractObjectKeyFromImageReference(currentImageUrl);

  if (!derivedImageObjectKey) {
    return null;
  }

  const derivedImageUrl = getPublicObjectUrl(derivedImageObjectKey);
  if (!derivedImageUrl) {
    throw new Error(
      "R2_PUBLIC_BASE_URL must be configured before running the image storage migration."
    );
  }

  if (
    currentImageObjectKey === derivedImageObjectKey &&
    currentImageUrl === derivedImageUrl
  ) {
    return null;
  }

  return {
    aid: animal.aid,
    name: animal.name,
    oldImageUrl: currentImageUrl,
    oldImageObjectKey: currentImageObjectKey,
    image_object_key: derivedImageObjectKey,
    image_url: derivedImageUrl,
  };
}

async function run({ apply = !DRY_RUN } = {}) {
  if (!isPublicObjectUrlConfigured) {
    throw new Error(
      "R2_PUBLIC_BASE_URL is not configured. Set it in apps/server/.env.local before running this migration."
    );
  }

  const supabase = getSupabaseClient();

  const { data: animals, error } = await supabase
    .from("animals")
    .select("aid, name, image_url, image_object_key");

  if (error) {
    if (
      /image_object_key/i.test(error.message || "") &&
      /(column|schema cache)/i.test(error.message || "")
    ) {
      throw new Error(
        "The animals.image_object_key column does not exist yet. Apply the SQL migration before running the data backfill."
      );
    }

    throw new Error(`Failed to fetch animals: ${error.message}`);
  }

  const toUpdate = animals
    .map(buildImageStorageUpdate)
    .filter(Boolean);

  if (toUpdate.length === 0) {
    console.log("No animal image storage updates are needed.");
    return { updated: 0, failed: 0, dryRun: !apply, items: [] };
  }

  console.log(`Found ${toUpdate.length} animal(s) needing image storage normalization:\n`);
  for (const item of toUpdate) {
    console.log(`  [aid=${item.aid}] ${item.name}`);
    console.log(`    OLD image_object_key: ${item.oldImageObjectKey || "(empty)"}`);
    console.log(`    OLD image_url: ${item.oldImageUrl || "(empty)"}`);
    console.log(`    NEW image_object_key: ${item.image_object_key}`);
    console.log(`    NEW image_url: ${item.image_url}`);
    console.log();
  }

  if (!apply) {
    console.log("Dry-run mode — no changes written. Re-run with --apply to update the DB.");
    return { updated: 0, failed: 0, dryRun: true, items: toUpdate };
  }

  console.log("Applying updates...\n");
  let updated = 0;
  let failed = 0;

  for (const item of toUpdate) {
    const { error: updateError } = await supabase
      .from("animals")
      .update({
        image_object_key: item.image_object_key,
        image_url: item.image_url,
      })
      .eq("aid", item.aid);

    if (updateError) {
      console.error(`  FAILED [aid=${item.aid}]: ${updateError.message}`);
      failed++;
      continue;
    }

    console.log(`  UPDATED [aid=${item.aid}] ${item.name}`);
    updated++;
  }

  console.log(`\nDone. ${updated} updated, ${failed} failed.`);

  if (failed > 0) {
    throw new Error("One or more animal image storage updates failed.");
  }

  return { updated, failed, dryRun: false, items: toUpdate };
}

if (require.main === module) {
  run()
    .catch((error) => {
      console.error(error.message || error);
      process.exit(1);
    });
}

module.exports = {
  buildImageStorageUpdate,
  run,
};
