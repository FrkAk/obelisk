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
const BATCH_SIZE = parseInt(process.env.EMBED_BATCH_SIZE || "25", 10);

interface EmbedResponse {
  embeddings: number[][];
}

async function embedTexts(texts: string[]): Promise<number[][]> {
  const response = await fetch(`${OLLAMA_URL}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: EMBED_MODEL,
      input: texts,
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

  return data.embeddings;
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

interface PoiContext {
  poi: Poi;
  text: string;
  profile: ProfileUnion;
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

  console.log(`[embeddings] Found ${unembeddedPois.length} POIs without embeddings (batch size: ${BATCH_SIZE})`);

  if (unembeddedPois.length === 0) {
    console.log("[embeddings] Nothing to do");
    process.exit(0);
  }

  let processed = 0;
  let errors = 0;

  for (let i = 0; i < unembeddedPois.length; i += BATCH_SIZE) {
    const batch = unembeddedPois.slice(i, i + BATCH_SIZE);

    const contexts: PoiContext[] = [];
    const failedRows: string[] = [];

    const contextResults = await Promise.allSettled(
      batch.map(async (row) => {
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

        const [profile, poiTagList, poiCuisineList, poiDishList, contact] =
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
          tags: poiTagList,
          cuisines: poiCuisineList,
          dishes: poiDishList,
          contactInfo: contact,
        });

        return { poi, text, profile: profile as ProfileUnion } satisfies PoiContext;
      }),
    );

    for (let j = 0; j < contextResults.length; j++) {
      const result = contextResults[j];
      if (result.status === "fulfilled") {
        contexts.push(result.value);
      } else {
        errors++;
        failedRows.push(batch[j].name);
        console.error(`[embeddings] Context load failed for "${batch[j].name}": ${result.reason}`);
      }
    }

    if (contexts.length === 0) continue;

    try {
      const texts = contexts.map((c) => c.text);
      const embeddings = await embedTexts(texts);

      await Promise.all(
        contexts.map(async (ctx, j) => {
          const vectorStr = `[${embeddings[j].join(",")}]`;

          await db.execute(
            sql`UPDATE pois
                SET embedding = ${vectorStr}::vector,
                    search_vector = to_tsvector('simple', ${ctx.text}),
                    updated_at = now()
                WHERE id = ${ctx.poi.id}`,
          );

          const completeness = profileCompleteness(ctx.profile);
          await db.insert(enrichmentLog).values({
            poiId: ctx.poi.id,
            source: "llm_embed",
            status: "success",
            fieldsUpdated: ["pois.embedding", "pois.search_vector"],
            metadata: {
              model: EMBED_MODEL,
              textLength: ctx.text.length,
              profileCompleteness: completeness.ratio,
              embeddingDim: embeddings[j].length,
            },
          });

          processed++;
        }),
      );
    } catch (error) {
      errors += contexts.length;
      console.error(
        `[embeddings] Batch embed failed:`,
        error instanceof Error ? error.message : error,
      );
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
