import { db } from "../src/lib/db/client";
import {
  pois,
  categories,
  tags,
  poiTags,
  cuisines,
  poiCuisines,
  poiDishes,
  dishes,
  contactInfo,
  foodProfiles,
  historyProfiles,
  architectureProfiles,
  natureProfiles,
  artCultureProfiles,
  nightlifeProfiles,
  shoppingProfiles,
  viewpointProfiles,
  enrichmentLog,
} from "../src/lib/db/schema";
import { eq, isNull, sql } from "drizzle-orm";
import { EMBED_MODEL, checkOllamaHealth } from "../src/lib/ai/ollama";
import { buildEmbeddingText, profileCompleteness } from "../src/lib/ai/embeddingBuilder";
import type { ProfileUnion } from "../src/lib/ai/embeddingBuilder";
import type {
  Poi,
  Tag,
  Cuisine,
  PoiDish,
  Dish,
  ContactInfo,
} from "../src/types";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const BATCH_SIZE = 10;

interface EmbedResponse {
  embeddings: number[][];
}

async function embedText(text: string): Promise<number[]> {
  const response = await fetch(`${OLLAMA_URL}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: EMBED_MODEL,
      input: text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Ollama embed error: ${response.status} - ${errorText}`);
  }

  const data: EmbedResponse = await response.json();

  if (!data.embeddings || data.embeddings.length === 0) {
    throw new Error("Ollama returned empty embeddings");
  }

  return data.embeddings[0];
}

const CATEGORY_PROFILE_TABLE: Record<string, typeof foodProfiles | typeof historyProfiles | typeof architectureProfiles | typeof natureProfiles | typeof artCultureProfiles | typeof nightlifeProfiles | typeof shoppingProfiles | typeof viewpointProfiles> = {
  food: foodProfiles,
  history: historyProfiles,
  architecture: architectureProfiles,
  nature: natureProfiles,
  art: artCultureProfiles,
  culture: artCultureProfiles,
  views: viewpointProfiles,
  nightlife: nightlifeProfiles,
  shopping: shoppingProfiles,
};

async function loadProfile(poiId: string, categorySlug: string) {
  const table = CATEGORY_PROFILE_TABLE[categorySlug];
  if (!table) return null;

  const results = await db
    .select()
    .from(table)
    .where(eq(table.poiId, poiId))
    .limit(1);

  return results[0] ?? null;
}

async function loadTags(poiId: string): Promise<Tag[]> {
  const results = await db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      group: tags.group,
      displayOrder: tags.displayOrder,
    })
    .from(poiTags)
    .innerJoin(tags, eq(poiTags.tagId, tags.id))
    .where(eq(poiTags.poiId, poiId));

  return results;
}

async function loadCuisines(poiId: string): Promise<Cuisine[]> {
  const results = await db
    .select({
      id: cuisines.id,
      slug: cuisines.slug,
      name: cuisines.name,
      region: cuisines.region,
      parentSlug: cuisines.parentSlug,
      icon: cuisines.icon,
    })
    .from(poiCuisines)
    .innerJoin(cuisines, eq(poiCuisines.cuisineId, cuisines.id))
    .where(eq(poiCuisines.poiId, poiId));

  return results;
}

async function loadDishes(poiId: string): Promise<Array<PoiDish & { dish: Dish }>> {
  const results = await db
    .select()
    .from(poiDishes)
    .innerJoin(dishes, eq(poiDishes.dishId, dishes.id))
    .where(eq(poiDishes.poiId, poiId));

  return results.map((r) => ({
    ...r.poi_dishes,
    dish: r.dishes,
  }));
}

async function loadContactInfo(poiId: string): Promise<ContactInfo | null> {
  const results = await db
    .select()
    .from(contactInfo)
    .where(eq(contactInfo.poiId, poiId))
    .limit(1);

  return results[0] ?? null;
}

async function generateEmbeddings() {
  console.log("[embeddings] Starting embedding generation from profile data...");

  const healthy = await checkOllamaHealth(EMBED_MODEL);
  if (!healthy) {
    console.error(`[embeddings] Ollama not available or model ${EMBED_MODEL} not loaded.`);
    console.log(`Run: ollama pull ${EMBED_MODEL}`);
    process.exit(1);
  }

  const unembeddedPois = await db
    .select({
      id: pois.id,
      osmId: pois.osmId,
      name: pois.name,
      categoryId: pois.categoryId,
      regionId: pois.regionId,
      latitude: pois.latitude,
      longitude: pois.longitude,
      address: pois.address,
      locale: pois.locale,
      osmType: pois.osmType,
      osmTags: pois.osmTags,
      wikipediaUrl: pois.wikipediaUrl,
      imageUrl: pois.imageUrl,
      embedding: pois.embedding,
      searchVector: pois.searchVector,
      createdAt: pois.createdAt,
      updatedAt: pois.updatedAt,
      categorySlug: categories.slug,
    })
    .from(pois)
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .where(isNull(pois.embedding));

  console.log(`[embeddings] Found ${unembeddedPois.length} POIs without embeddings`);

  if (unembeddedPois.length === 0) {
    console.log("[embeddings] Nothing to do");
    process.exit(0);
  }

  let processed = 0;
  let errors = 0;

  for (let i = 0; i < unembeddedPois.length; i += BATCH_SIZE) {
    const batch = unembeddedPois.slice(i, i + BATCH_SIZE);

    for (const row of batch) {
      try {
        const categorySlug = row.categorySlug ?? "";
        const poi: Poi = {
          id: row.id,
          osmId: row.osmId,
          name: row.name,
          categoryId: row.categoryId,
          regionId: row.regionId,
          latitude: row.latitude,
          longitude: row.longitude,
          address: row.address,
          locale: row.locale,
          osmType: row.osmType,
          osmTags: row.osmTags,
          wikipediaUrl: row.wikipediaUrl,
          imageUrl: row.imageUrl,
          embedding: row.embedding,
          searchVector: row.searchVector,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        };

        const [profile, poiTags, poiCuisineList, poiDishList, contact] =
          await Promise.all([
            loadProfile(poi.id, categorySlug),
            loadTags(poi.id),
            loadCuisines(poi.id),
            loadDishes(poi.id),
            loadContactInfo(poi.id),
          ]);

        const text = buildEmbeddingText({
          poi,
          profile: profile as ProfileUnion,
          tags: poiTags,
          cuisines: poiCuisineList,
          dishes: poiDishList,
          contactInfo: contact,
        });

        const embedding = await embedText(text);
        const vectorStr = `[${embedding.join(",")}]`;

        await db.execute(
          sql`UPDATE pois
              SET embedding = ${vectorStr}::vector,
                  search_vector = to_tsvector('simple', ${text}),
                  updated_at = now()
              WHERE id = ${poi.id}`,
        );

        const completeness = profileCompleteness(profile as ProfileUnion);
        await db.insert(enrichmentLog).values({
          poiId: poi.id,
          source: "llm_embed",
          status: "success",
          fieldsUpdated: ["pois.embedding", "pois.search_vector"],
          metadata: {
            model: EMBED_MODEL,
            textLength: text.length,
            profileCompleteness: completeness.ratio,
            embeddingDim: embedding.length,
          },
        });

        processed++;
      } catch (error) {
        errors++;
        console.error(
          `[embeddings] Error for "${row.name}":`,
          error instanceof Error ? error.message : error,
        );
      }
    }

    console.log(
      `[embeddings] Progress: ${processed + errors}/${unembeddedPois.length} (${errors} errors)`,
    );
  }

  console.log(`[embeddings] Done! Processed: ${processed}, Errors: ${errors}`);
  process.exit(0);
}

generateEmbeddings().catch((error) => {
  console.error("[embeddings] Fatal error:", error);
  process.exit(1);
});
