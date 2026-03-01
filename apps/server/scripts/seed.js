/**
 * Seed Data Script
 * Populates the database with sample animal data for development/testing.
 *
 * Usage: npm run seed
 */

const path = require("path");
// Load environment variables from the server root .env.local
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env.local") });

const { getSupabaseClient } = require("../lib/supabase");

const SEED_ANIMALS = [
  {
    name: "Buddy",
    description: "Friendly golden retriever who loves to play fetch. Great with kids and other dogs. House trained and knows basic commands.",
    species: "dog",
    size: "large",
    gender: "male",
    status: "available",
    image_url: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=800",
  },
  {
    name: "Whiskers",
    description: "Calm and affectionate tabby cat. Enjoys sunny spots and gentle pets. Ideal for a quiet home.",
    species: "cat",
    size: "small",
    gender: "female",
    status: "available",
    image_url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800",
  },
  {
    name: "Max",
    description: "Energetic border collie mix. Very intelligent and eager to learn. Needs an active family with yard space.",
    species: "dog",
    size: "medium",
    gender: "male",
    status: "pending",
    image_url: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
  },
  {
    name: "Luna",
    description: "Sweet black cat who loves to cuddle. Gets along with other cats. Looking for her forever home.",
    species: "cat",
    size: "small",
    gender: "female",
    status: "available",
    image_url: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800",
  },
  {
    name: "Rocky",
    description: "Loyal pitbull terrier. Great guard dog but very gentle with family. Loves belly rubs and car rides.",
    species: "dog",
    size: "large",
    gender: "male",
    status: "adopted",
    image_url: "https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=800",
  },
  {
    name: "Bella",
    description: "Playful beagle puppy. Still learning basic training. Would thrive with patient first-time owners.",
    species: "dog",
    size: "medium",
    gender: "female",
    status: "available",
    image_url: "https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=800",
  },
  {
    name: "Oliver",
    description: "Senior orange cat with a calm demeanor. Perfect companion for someone looking for a low-maintenance pet.",
    species: "cat",
    size: "medium",
    gender: "male",
    status: "fostered",
    image_url: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800",
  },
  {
    name: "Daisy",
    description: "Gentle labrador retriever recovering from minor surgery. Will be ready for adoption soon.",
    species: "dog",
    size: "large",
    gender: "female",
    status: "medical_hold",
    image_url: "https://images.unsplash.com/photo-1579213838826-68a4c2d3b053?w=800",
  },
  {
    name: "Simba",
    description: "Majestic Maine Coon with a fluffy coat. Independent but enjoys human company. Great mouser.",
    species: "cat",
    size: "large",
    gender: "male",
    status: "available",
    image_url: "https://images.unsplash.com/photo-1606214174585-fe31582dc6ee?w=800",
  },
  {
    name: "Charlie",
    description: "Friendly mixed breed pup rescued from a shelter. Very social and loves meeting new people and dogs.",
    species: "dog",
    size: "medium",
    gender: "male",
    status: "available",
    image_url: "https://images.unsplash.com/photo-1544568100-847a948585b9?w=800",
  },
  {
    name: "Cleo",
    description: "Elegant Siamese cat with striking blue eyes. Vocal and loves attention. Best as only pet.",
    species: "cat",
    size: "small",
    gender: "female",
    status: "available",
    image_url: "https://images.unsplash.com/photo-1513245543132-31f507417b26?w=800",
  },
  {
    name: "Duke",
    description: "Gentle giant German Shepherd. Well-trained and protective. Good with older children.",
    species: "dog",
    size: "extra_large",
    gender: "male",
    status: "available",
    image_url: "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=800",
  },
];

async function seedDatabase() {
  console.log("Starting database seed...\n");

  try {
    const client = getSupabaseClient();

    // Check existing animals count
    const { count: existingCount } = await client
      .from("animals")
      .select("*", { count: "exact", head: true });

    if (existingCount > 0) {
      console.log(`Database already has ${existingCount} animals.`);
      console.log("   Use --force to clear and reseed, or --append to add more.\n");

      const args = process.argv.slice(2);

      if (args.includes("--force")) {
        console.log("🗑️  Clearing existing animals...");
        const { error: deleteError } = await client.from("animals").delete().gte("aid", 0);
        if (deleteError) {
          throw new Error(`Failed to clear animals: ${deleteError.message}`);
        }
        console.log("✓  Animals cleared.\n");
      } else if (!args.includes("--append")) {
        console.log("Exiting. No changes made.");
        process.exit(0);
      }
    }

    // Insert seed data
    console.log(`Inserting ${SEED_ANIMALS.length} sample animals...`);

    const { data, error } = await client.from("animals").insert(SEED_ANIMALS).select();

    if (error) {
      throw new Error(`Failed to insert animals: ${error.message}`);
    }

    console.log(`✓  Successfully inserted ${data.length} animals.\n`);

    // Display summary
    console.log("Seed Summary:");
    console.log("   Dogs:", data.filter((a) => a.species === "dog").length);
    console.log("   Cats:", data.filter((a) => a.species === "cat").length);
    console.log("   Available:", data.filter((a) => a.status === "available").length);
    console.log("   Other statuses:", data.filter((a) => a.status !== "available").length);
    console.log("\nDatabase seeding complete!");
  } catch (err) {
    console.error("\nSeeding failed:", err.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, SEED_ANIMALS };
