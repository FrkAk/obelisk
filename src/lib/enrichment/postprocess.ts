import { db } from "@/lib/db/client";
import { pois, enrichmentLog, remarks } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { loadProfile, loadTags, loadCuisines, loadDishes, loadContactInfo, loadTranslation, loadCurrentRemark } from "@/lib/db/queries/pois";
import { buildEmbeddingText } from "@/lib/ai/embeddingBuilder";
import type { ProfileUnion } from "@/lib/ai/embeddingBuilder";
import { embedTexts } from "@/lib/ai/embeddings";
import { EMBED_MODEL } from "@/lib/ai/ollama";
import { buildProfileSummary, buildTypesenseDocument } from "@/lib/search/profileSummary";
import { upsertDocuments } from "@/lib/search/typesense";
import { createLogger } from "@/lib/logger";

const log = createLogger("postprocess");

/**
 * Syncs a single POI's embedding and Typesense document after on-demand changes.
 * Catches errors internally, logs failures. Never throws.
 *
 * Args:
 *     poiId: The POI UUID.
 *     categorySlug: The POI's category slug.
 */
export async function syncPoiSearchIndex(
  poiId: string,
  categorySlug: string,
): Promise<void> {
  try {
    const poi = await db
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
      })
      .from(pois)
      .where(eq(pois.id, poiId))
      .limit(1)
      .then((r) => r[0]);

    if (!poi) {
      log.warn(`POI not found for postprocess: ${poiId}`);
      return;
    }

    const [profile, tagList, cuisineList, dishList, contact, translation, remarkContent] =
      await Promise.all([
        loadProfile(poiId, categorySlug),
        loadTags(poiId),
        loadCuisines(poiId),
        loadDishes(poiId),
        loadContactInfo(poiId),
        loadTranslation(poiId, poi.locale),
        loadCurrentRemark(poiId),
      ]);

    const embeddingText = buildEmbeddingText({
      poi,
      profile: profile as ProfileUnion,
      tags: tagList,
      cuisines: cuisineList,
      dishes: dishList,
      contactInfo: contact,
      description: translation?.description ?? undefined,
      reviewSummary: translation?.reviewSummary ?? undefined,
      remarkContent: remarkContent ?? undefined,
    });

    try {
      const [embedding] = await embedTexts([embeddingText]);
      const vectorStr = `[${embedding.join(",")}]`;

      await db.execute(
        sql`UPDATE pois
            SET embedding = ${vectorStr}::vector,
                search_vector = to_tsvector('simple', ${embeddingText}),
                updated_at = now()
            WHERE id = ${poiId}`,
      );

      await db.insert(enrichmentLog).values({
        poiId,
        source: "llm_embed",
        status: "success",
        fieldsUpdated: ["pois.embedding", "pois.search_vector"],
        metadata: {
          model: EMBED_MODEL,
          textLength: embeddingText.length,
          embeddingDim: embedding.length,
          trigger: "on_demand",
        },
      });

      log.info(`Embedding updated for POI: ${poi.name}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      log.warn(`Embedding generation failed for ${poi.name}: ${msg}`);
    }

    try {
      const hasStory = await db
        .select({ id: remarks.id })
        .from(remarks)
        .where(eq(remarks.poiId, poiId))
        .limit(1)
        .then((r) => r.length > 0);

      const profileSummary = profile
        ? buildProfileSummary(categorySlug, profile as Record<string, unknown>)
        : undefined;

      const doc = buildTypesenseDocument({
        id: poiId,
        osmId: poi.osmId,
        name: poi.name,
        latitude: poi.latitude,
        longitude: poi.longitude,
        address: poi.address,
        osmTags: poi.osmTags,
        categorySlug,
        description: translation?.description ?? null,
        reviewSummary: translation?.reviewSummary ?? null,
        profile: profile as Record<string, unknown> | null,
        profileSummary,
        tags: tagList.map((t) => t.name),
        signatureDishes: dishList
          .filter((d) => d.isSignature)
          .map((d) => d.dish.name),
        hasStory,
      });

      await upsertDocuments([doc]);
      log.info(`Typesense synced for POI: ${poi.name}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      log.warn(`Typesense sync failed for ${poi.name}: ${msg}`);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    log.error(`Postprocess failed for POI ${poiId}: ${msg}`);
  }
}
