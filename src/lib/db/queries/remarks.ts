import { db } from "../client";
import { remarks, pois, categories } from "../schema";
import { eq, and, inArray, desc, sql } from "drizzle-orm";
import type { CategorySlug } from "@/types";

export type RemarkWithPoi = {
  id: string;
  poiId: string;
  title: string;
  teaser: string | null;
  content: string;
  localTip: string | null;
  durationSeconds: number;
  audioUrl: string | null;
  createdAt: Date;
  locale: string | null;
  version: number;
  isCurrent: boolean | null;
  modelId: string | null;
  confidence: string | null;
  poi: {
    id: string;
    osmId: number | null;
    name: string;
    categoryId: string;
    latitude: number;
    longitude: number;
    address: string | null;
    locale: string;
    wikipediaUrl: string | null;
    imageUrl: string | null;
    osmTags: Record<string, string> | null;
    createdAt: Date;
    category?: {
      id: string;
      name: string;
      slug: CategorySlug;
      icon: string;
      color: string;
    };
  };
};

function remarkPoiSelect() {
  return {
    remarkId: remarks.id,
    remarkPoiId: remarks.poiId,
    remarkTitle: remarks.title,
    remarkTeaser: remarks.teaser,
    remarkContent: remarks.content,
    remarkLocalTip: remarks.localTip,
    remarkDurationSeconds: remarks.durationSeconds,
    remarkAudioUrl: remarks.audioUrl,
    remarkCreatedAt: remarks.createdAt,
    remarkLocale: remarks.locale,
    remarkVersion: remarks.version,
    remarkIsCurrent: remarks.isCurrent,
    remarkModelId: remarks.modelId,
    remarkConfidence: remarks.confidence,
    poiId: pois.id,
    poiOsmId: pois.osmId,
    poiName: pois.name,
    poiCategoryId: pois.categoryId,
    poiLatitude: pois.latitude,
    poiLongitude: pois.longitude,
    poiAddress: pois.address,
    poiLocale: pois.locale,
    poiWikipediaUrl: pois.wikipediaUrl,
    poiImageUrl: pois.imageUrl,
    poiOsmTags: pois.osmTags,
    poiCreatedAt: pois.createdAt,
    categoryId: categories.id,
    categoryName: categories.name,
    categorySlug: categories.slug,
    categoryIcon: categories.icon,
    categoryColor: categories.color,
  };
}

interface RemarkPoiRow {
  remarkId: string;
  remarkPoiId: string | null;
  remarkTitle: string;
  remarkTeaser: string | null;
  remarkContent: string;
  remarkLocalTip: string | null;
  remarkDurationSeconds: number | null;
  remarkAudioUrl: string | null;
  remarkCreatedAt: Date | null;
  remarkLocale: string | null;
  remarkVersion: number;
  remarkIsCurrent: boolean | null;
  remarkModelId: string | null;
  remarkConfidence: string | null;
  poiId: string;
  poiOsmId: number | null;
  poiName: string;
  poiCategoryId: string | null;
  poiLatitude: number;
  poiLongitude: number;
  poiAddress: string | null;
  poiLocale: string;
  poiWikipediaUrl: string | null;
  poiImageUrl: string | null;
  poiOsmTags: Record<string, string> | null;
  poiCreatedAt: Date | null;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
}

function mapRowToRemarkWithPoi(row: RemarkPoiRow): RemarkWithPoi {
  return {
    id: row.remarkId,
    poiId: row.remarkPoiId!,
    title: row.remarkTitle,
    teaser: row.remarkTeaser,
    content: row.remarkContent,
    localTip: row.remarkLocalTip,
    durationSeconds: row.remarkDurationSeconds ?? 45,
    audioUrl: row.remarkAudioUrl,
    createdAt: row.remarkCreatedAt ?? new Date(),
    locale: row.remarkLocale,
    version: row.remarkVersion,
    isCurrent: row.remarkIsCurrent,
    modelId: row.remarkModelId,
    confidence: row.remarkConfidence,
    poi: {
      id: row.poiId,
      osmId: row.poiOsmId,
      name: row.poiName,
      categoryId: row.poiCategoryId!,
      latitude: row.poiLatitude,
      longitude: row.poiLongitude,
      address: row.poiAddress,
      locale: row.poiLocale,
      wikipediaUrl: row.poiWikipediaUrl,
      imageUrl: row.poiImageUrl,
      osmTags: row.poiOsmTags,
      createdAt: row.poiCreatedAt ?? new Date(),
      category: row.categoryId
        ? {
            id: row.categoryId,
            name: row.categoryName!,
            slug: row.categorySlug! as CategorySlug,
            icon: row.categoryIcon!,
            color: row.categoryColor!,
          }
        : undefined,
    },
  };
}

/**
 * Fetches current remarks for the given POI IDs. Only returns is_current = true.
 *
 * Args:
 *     poiIds: Array of POI UUIDs.
 *
 * Returns:
 *     Array of current remarks with their POIs and categories.
 */
export async function getRemarksByPoiIds(
  poiIds: string[]
): Promise<RemarkWithPoi[]> {
  if (poiIds.length === 0) return [];

  const results = await db
    .select(remarkPoiSelect())
    .from(remarks)
    .innerJoin(pois, eq(remarks.poiId, pois.id))
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .where(and(inArray(remarks.poiId, poiIds), eq(remarks.isCurrent, true)));

  return results.map(mapRowToRemarkWithPoi);
}

/**
 * Fetches a single current remark by ID.
 *
 * Args:
 *     remarkId: The remark's UUID.
 *
 * Returns:
 *     The remark with its POI and category, or undefined.
 */
export async function getRemarkById(
  remarkId: string
): Promise<RemarkWithPoi | undefined> {
  const results = await db
    .select(remarkPoiSelect())
    .from(remarks)
    .innerJoin(pois, eq(remarks.poiId, pois.id))
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .where(eq(remarks.id, remarkId))
    .limit(1);

  const row = results[0];
  if (!row) return undefined;

  return mapRowToRemarkWithPoi(row);
}

/**
 * Fetches the current remark for a POI.
 *
 * Args:
 *     poiId: The POI's UUID.
 *
 * Returns:
 *     The current remark with its POI, or undefined.
 */
export async function getCurrentRemarkForPoi(
  poiId: string
): Promise<RemarkWithPoi | undefined> {
  const results = await db
    .select(remarkPoiSelect())
    .from(remarks)
    .innerJoin(pois, eq(remarks.poiId, pois.id))
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .where(and(eq(remarks.poiId, poiId), eq(remarks.isCurrent, true)))
    .limit(1);

  const row = results[0];
  if (!row) return undefined;

  return mapRowToRemarkWithPoi(row);
}

/**
 * Fetches all remark versions for a POI, ordered by version descending.
 *
 * Args:
 *     poiId: The POI's UUID.
 *
 * Returns:
 *     Array of all remark versions for the POI.
 */
export async function getRemarkVersions(
  poiId: string
): Promise<RemarkWithPoi[]> {
  const results = await db
    .select(remarkPoiSelect())
    .from(remarks)
    .innerJoin(pois, eq(remarks.poiId, pois.id))
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .where(eq(remarks.poiId, poiId))
    .orderBy(desc(remarks.version));

  return results.map(mapRowToRemarkWithPoi);
}

/**
 * Version-bumps a remark: sets old remark is_current=false, inserts new version.
 *
 * Args:
 *     oldRemarkId: The ID of the current remark to supersede.
 *     newRemarkData: The data for the new remark version.
 *
 * Returns:
 *     The newly inserted remark row.
 */
export async function versionBumpRemark(
  oldRemarkId: string,
  newRemarkData: {
    poiId: string;
    title: string;
    teaser: string | null;
    content: string;
    localTip: string | null;
    durationSeconds: number;
    locale?: string;
    modelId?: string;
    confidence?: string;
    contextSources?: Record<string, unknown>;
  }
) {
  const oldRemark = await db
    .select({
      version: remarks.version,
      locale: remarks.locale,
    })
    .from(remarks)
    .where(eq(remarks.id, oldRemarkId))
    .limit(1);

  const currentVersion = oldRemark[0]?.version ?? 0;
  const locale = newRemarkData.locale ?? oldRemark[0]?.locale ?? null;

  await db
    .update(remarks)
    .set({ isCurrent: false })
    .where(eq(remarks.id, oldRemarkId));

  const [newRemark] = await db
    .insert(remarks)
    .values({
      poiId: newRemarkData.poiId,
      locale,
      version: currentVersion + 1,
      isCurrent: true,
      title: newRemarkData.title,
      teaser: newRemarkData.teaser,
      content: newRemarkData.content,
      localTip: newRemarkData.localTip,
      durationSeconds: newRemarkData.durationSeconds,
      modelId: newRemarkData.modelId ?? null,
      confidence: newRemarkData.confidence ?? null,
      contextSources: newRemarkData.contextSources ?? null,
    })
    .returning();

  return newRemark;
}

/**
 * Gets the max version number for a POI's remarks.
 *
 * Args:
 *     poiId: The POI's UUID.
 *
 * Returns:
 *     The highest version number, or 0 if no remarks exist.
 */
export async function getMaxRemarkVersion(poiId: string): Promise<number> {
  const result = await db
    .select({
      maxVersion: sql<number>`COALESCE(MAX(${remarks.version}), 0)`,
    })
    .from(remarks)
    .where(eq(remarks.poiId, poiId));

  return result[0]?.maxVersion ?? 0;
}
