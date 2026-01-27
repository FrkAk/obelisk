import { db } from "../src/lib/db/client";
import { pois, remarks, categories } from "../src/lib/db/schema";
import { eq, isNull } from "drizzle-orm";
import { generateStoriesBatch } from "../src/lib/ai/storyGenerator";
import { checkOllamaHealth } from "../src/lib/ai/ollama";

async function main() {
  console.log("Checking Ollama availability...");
  const isHealthy = await checkOllamaHealth();

  if (!isHealthy) {
    console.error("Ollama is not available or model not loaded.");
    console.log("Run: docker compose exec ollama ollama pull gemma3:4b-it-q4_K_M");
    process.exit(1);
  }

  console.log("Ollama is ready!");

  console.log("Fetching POIs without remarks...");

  const poisWithoutRemarks = await db
    .select({
      id: pois.id,
      name: pois.name,
      address: pois.address,
      wikipediaUrl: pois.wikipediaUrl,
      osmTags: pois.osmTags,
      categoryName: categories.name,
    })
    .from(pois)
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .leftJoin(remarks, eq(pois.id, remarks.poiId))
    .where(isNull(remarks.id))
    .limit(100);

  if (poisWithoutRemarks.length === 0) {
    console.log("All POIs already have remarks!");
    process.exit(0);
  }

  console.log(`Found ${poisWithoutRemarks.length} POIs without remarks`);

  const poisToProcess = poisWithoutRemarks.map((poi) => ({
    id: poi.id,
    poi: {
      name: poi.name,
      categoryName: poi.categoryName || "Hidden Gems",
      address: poi.address,
      wikipediaUrl: poi.wikipediaUrl,
      osmTags: poi.osmTags,
    },
  }));

  console.log("Generating stories with Ollama...");
  let savedCount = 0;

  for (const { id, poi } of poisToProcess) {
    try {
      const { generateStory } = await import("../src/lib/ai/storyGenerator");
      const story = await generateStory(poi);

      await db.insert(remarks).values({
        poiId: id,
        title: story.title.slice(0, 100),
        teaser: story.teaser.slice(0, 100),
        content: story.content,
        localTip: story.localTip,
        durationSeconds: story.durationSeconds,
      });

      savedCount++;
      console.log(`[${savedCount}/${poisToProcess.length}] Saved: ${poi.name}`);

      await new Promise((r) => setTimeout(r, 300));
    } catch (error) {
      console.error(`Failed to generate/save story for ${poi.name}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log(`Generated and saved ${savedCount} stories`)

  console.log("Story generation complete!");
  process.exit(0);
}

main().catch((error) => {
  console.error("Story generation failed:", error);
  process.exit(1);
});
