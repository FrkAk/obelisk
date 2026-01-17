/**
 * Seed script to import Munich POIs from OpenStreetMap.
 *
 * Run with: npx tsx scripts/seed-osm-pois.ts
 */

import "dotenv/config";
import { importPoisFromOsm } from "../src/server/services/osm-import";
import { MUNICH_BOUNDS } from "../src/lib/constants/map";

async function main() {
  console.log("Starting OSM POI import for Munich...");
  console.log(`Bounding box: ${JSON.stringify(MUNICH_BOUNDS)}`);

  try {
    const result = await importPoisFromOsm({
      bbox: MUNICH_BOUNDS,
      categories: ["tourism", "historic", "amenity"],
    });

    console.log("\nImport completed!");
    console.log(`  Imported: ${result.imported}`);
    console.log(`  Updated: ${result.updated}`);
    console.log(`  Skipped: ${result.skipped}`);
    console.log(`  Errors: ${result.errors}`);
    console.log(`  Total processed: ${result.imported + result.updated + result.skipped + result.errors}`);
  } catch (error) {
    console.error("Import failed:", error);
    process.exit(1);
  }
}

main();
