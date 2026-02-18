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
  poiTranslations,
  remarks,
} from "../src/lib/db/schema";
import { and, eq, isNull, sql, or } from "drizzle-orm";
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
import { createLogger } from "../src/lib/logger";

const log = createLogger("embeddings");

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const BATCH_SIZE = parseInt(process.env.EMBED_BATCH_SIZE || "25", 10);
const STALE_MODE = process.argv.includes("--stale");

interface EmbedResponse {
  embeddings: number[][];
}

/**
 * Sends texts to Ollama for embedding generation.
 *
 * Args:
 *     texts: Array of text strings to embed.
 *
 * Returns:
 *     Array of embedding vectors.
 */
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

/**
 * Loads translation data (description, reviewSummary) for a POI.
 *
 * Args:
 *     poiId: The POI UUID.
 *     locale: The POI locale for matching translations.
 *
 * Returns:
 *     Object with description and reviewSummary, or null if no translation exists.
 */
async function loadTranslation(
  poiId: string,
  locale: string,
): Promise<{ description: string | null; reviewSummary: string | null } | null> {
  const results = await db
    .select({
      description: poiTranslations.description,
      reviewSummary: poiTranslations.reviewSummary,
    })
    .from(poiTranslations)
    .where(and(eq(poiTranslations.poiId, poiId), eq(poiTranslations.locale, locale)))
    .limit(1);

  return results[0] ?? null;
}

/**
 * Loads the current remark content for a POI.
 *
 * Args:
 *     poiId: The POI UUID.
 *
 * Returns:
 *     The remark content string, or null if no current remark exists.
 */
async function loadCurrentRemark(poiId: string): Promise<string | null> {
  const results = await db
    .select({ content: remarks.content })
    .from(remarks)
    .where(and(eq(remarks.poiId, poiId), eq(remarks.isCurrent, true)))
    .limit(1);

  return results[0]?.content ?? null;
}

interface PoiContext {
  poi: Poi;
  text: string;
  profile: ProfileUnion;
}

const POI_SELECT_FIELDS = {
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
} as const;

/**
 * Fetches POIs that need embedding generation.
 * In default mode, selects POIs without embeddings.
 * In stale mode, also includes POIs whose enrichment_log has newer entries than pois.updatedAt.
 *
 * Args:
 *     stale: Whether to include stale embeddings.
 *
 * Returns:
 *     Array of POI rows with category slug.
 */
async function fetchTargetPois(stale: boolean) {
  const enrichedFilter = sql`${pois.id} IN (
    SELECT ${enrichmentLog.poiId} FROM ${enrichmentLog}
    WHERE ${enrichmentLog.source} = 'enrich'
      AND ${enrichmentLog.status} IN ('success', 'success_fb')
  )`;

  if (!stale) {
    return db
      .select(POI_SELECT_FIELDS)
      .from(pois)
      .leftJoin(categories, eq(pois.categoryId, categories.id))
      .where(and(isNull(pois.embedding), enrichedFilter));
  }

  const staleSubquery = db
    .select({ poiId: enrichmentLog.poiId })
    .from(enrichmentLog)
    .where(
      sql`${enrichmentLog.createdAt} > (SELECT updated_at FROM pois WHERE pois.id = ${enrichmentLog.poiId})`,
    )
    .groupBy(enrichmentLog.poiId);

  return db
    .select(POI_SELECT_FIELDS)
    .from(pois)
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .where(
      and(
        enrichedFilter,
        or(
          isNull(pois.embedding),
          sql`${pois.id} IN (${staleSubquery})`,
        ),
      ),
    );
}

async function generateEmbeddings() {
  const modeLabel = STALE_MODE ? "stale + missing" : "missing only";
  log.info(`Starting embedding generation (mode: ${modeLabel})...`);

  const healthy = await checkOllamaHealth(EMBED_MODEL);
  if (!healthy) {
    log.error(`Ollama not available or model ${EMBED_MODEL} not loaded.`);
    log.info(`Run: ollama pull ${EMBED_MODEL}`);
    process.exit(1);
  }

  const cleaned = await db.execute<{ id: string }>(sql`
    UPDATE pois
    SET embedding = NULL, search_vector = NULL, updated_at = now()
    WHERE embedding IS NOT NULL
      AND id NOT IN (
        SELECT poi_id FROM enrichment_log
        WHERE source = 'enrich' AND status IN ('success', 'success_fb')
      )
    RETURNING id
  `);
  if (cleaned.length > 0) {
    log.info(`Cleaned ${cleaned.length} low-quality embeddings from unenriched POIs`);
  }

  const targetPois = await fetchTargetPois(STALE_MODE);

  log.info(`Found ${targetPois.length} POIs to embed (batch size: ${BATCH_SIZE})`);

  if (targetPois.length === 0) {
    log.info("Nothing to do");
    process.exit(0);
  }

  let processed = 0;
  let errors = 0;

  for (let i = 0; i < targetPois.length; i += BATCH_SIZE) {
    const batch = targetPois.slice(i, i + BATCH_SIZE);

    const contexts: PoiContext[] = [];

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

        const [profile, poiTagList, poiCuisineList, poiDishList, contact, translation, remarkContent] =
          await Promise.all([
            loadProfile(poi.id, categorySlug),
            loadTags(poi.id),
            loadCuisines(poi.id),
            loadDishes(poi.id),
            loadContactInfo(poi.id),
            loadTranslation(poi.id, poi.locale),
            loadCurrentRemark(poi.id),
          ]);

        const text = buildEmbeddingText({
          poi,
          profile: profile as ProfileUnion,
          tags: poiTagList,
          cuisines: poiCuisineList,
          dishes: poiDishList,
          contactInfo: contact,
          description: translation?.description ?? undefined,
          reviewSummary: translation?.reviewSummary ?? undefined,
          remarkContent: remarkContent ?? undefined,
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
        log.error(`Context load failed for "${batch[j].name}": ${result.reason}`);
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
              staleMode: STALE_MODE,
            },
          });

          processed++;
        }),
      );
    } catch (error) {
      errors += contexts.length;
      log.error(
        "Batch embed failed:",
        error instanceof Error ? error.message : error,
      );
    }

    log.info(
      `Progress: ${processed + errors}/${targetPois.length} (${errors} errors)`,
    );
  }

  log.success(`Done! Processed: ${processed}, Errors: ${errors}`);
  process.exit(0);
}

generateEmbeddings().catch((error) => {
  log.error("Fatal error:", error);
  process.exit(1);
});
