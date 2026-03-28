import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { pois, categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateRemark } from "@/lib/ai/remarkGenerator";
import type { RemarkPoiContext } from "@/lib/ai/remarkGenerator";
import { checkOllamaHealth } from "@/lib/ai/ollama";
import { loadTags, loadContactInfo } from "@/lib/db/queries/pois";
import { z } from "zod";
import { createLogger } from "@/lib/logger";
import { getCategorySlug } from "@/lib/geo/categories";
import { buildProfile } from "@/lib/poi/profile";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { enrichPoiOnDemand } from "@/lib/poi/on-demand-enrich";
import type { CategorySlug, PoiProfile } from "@/types";
import { getCurrentRemarkForPoi, insertRemark } from "@/lib/db/queries/remarks";

const log = createLogger("generate-for-poi");

const externalPoiSchema = z.object({
  id: z.string(),
  osmId: z.number(),
  osmType: z.string(),
  name: z.string(),
  category: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().optional(),
  openingHours: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  cuisine: z.string().optional(),
  hasWifi: z.boolean().optional(),
  hasOutdoorSeating: z.boolean().optional(),
  images: z.array(z.object({ id: z.string(), url: z.string(), source: z.string() })).optional(),
  mapillaryId: z.string().optional(),
  mapillaryBearing: z.number().optional(),
  mapillaryIsPano: z.boolean().optional(),
  wikipediaUrl: z.string().optional(),
  extraTags: z.record(z.string(), z.string()).optional(),
  source: z.enum(["nominatim", "overpass", "synthetic"]),
});

const bodySchema = z.object({
  poi: externalPoiSchema,
  locale: z.enum(["en", "tr", "en-DE", "de-DE", "tr-TR"]).optional(),
});


/**
 * Generates a remark for a specific external POI.
 *
 * @param request - Incoming request with POI data and optional locale.
 * @returns Generated remark with POI data, or cached remark if exists.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(ip, 5, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  try {
    let body: unknown;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
    const parseResult = bodySchema.safeParse(body);

    if (!parseResult.success) {
      log.warn("Invalid parameters:", parseResult.error.flatten());
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 }
      );
    }

    const { poi: externalPoi, locale: requestLocale } = parseResult.data;

    log.info(
      `Request for: "${externalPoi.name}" (osmId: ${externalPoi.osmId}, locale: ${requestLocale ?? "default"}, website: ${externalPoi.website || "none"})`
    );

    const existingPoi = await findPoiByOsmId(externalPoi.osmId);

    if (existingPoi) {
      log.info(
        `Found existing POI in DB: "${existingPoi.name}" (id: ${existingPoi.id})`
      );

      const existingRemark = await getCurrentRemarkForPoi(existingPoi.id, requestLocale);

      if (existingRemark && (!requestLocale || existingRemark.locale === requestLocale)) {
        log.success(
          `Returning cached remark: "${existingRemark.title}" for "${existingRemark.poi.name}"`
        );
        return NextResponse.json({
          remark: existingRemark,
          cached: true,
        });
      }

      log.info(
        `No remark for locale "${requestLocale}", generating new one for: "${existingPoi.name}"`
      );
      return await generateAndSaveRemark(existingPoi, requestLocale);
    }

    log.info(`POI not in DB, creating new: "${externalPoi.name}"`);
    const newPoi = await createPoiFromExternal(externalPoi);
    return await generateAndSaveRemark(newPoi, requestLocale);
  } catch (error) {
    log.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Finds an existing POI in the database by OSM ID.
 *
 * @param osmId - The OpenStreetMap ID to search for.
 * @returns POI row with category data, or null if not found.
 */
async function findPoiByOsmId(osmId: number) {
  const results = await db
    .select({
      id: pois.id,
      osmId: pois.osmId,
      name: pois.name,
      categoryId: pois.categoryId,
      latitude: pois.latitude,
      longitude: pois.longitude,
      address: pois.address,
      locale: pois.locale,
      profile: pois.profile,
      wikipediaUrl: pois.wikipediaUrl,
      mapillaryId: pois.mapillaryId,
      mapillaryBearing: pois.mapillaryBearing,
      mapillaryIsPano: pois.mapillaryIsPano,
      osmTags: pois.osmTags,
      createdAt: pois.createdAt,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
    })
    .from(pois)
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .where(eq(pois.osmId, osmId))
    .limit(1);

  return results[0] || null;
}

/**
 * Creates a new POI in the database from external data.
 * Handles race conditions via onConflictDoNothing.
 *
 * @param externalPoi - Validated external POI data.
 * @returns Inserted POI row with category data.
 * @throws When insert fails and no existing POI is found.
 */
async function createPoiFromExternal(
  externalPoi: z.infer<typeof externalPoiSchema>
) {
  const categorySlug = getCategorySlug(externalPoi.category);

  const allCategories = await db.select().from(categories);
  const category = allCategories.find((c) => c.slug === categorySlug);

  const osmTags: Record<string, string> = {
    ...(externalPoi.extraTags ?? {}),
  };
  if (externalPoi.openingHours) osmTags.opening_hours = externalPoi.openingHours;
  if (externalPoi.phone) osmTags.phone = externalPoi.phone;
  if (externalPoi.website) osmTags.website = externalPoi.website;
  if (externalPoi.cuisine) osmTags.cuisine = externalPoi.cuisine;
  if (externalPoi.hasWifi) osmTags.internet_access = "wlan";
  if (externalPoi.hasOutdoorSeating) osmTags.outdoor_seating = "yes";

  const profile = Object.keys(osmTags).length > 0
    ? buildProfile(osmTags, categorySlug)
    : null;

  const insertResult = await db
    .insert(pois)
    .values({
      osmId: externalPoi.osmId,
      name: externalPoi.name,
      categoryId: category?.id ?? null,
      latitude: externalPoi.latitude,
      longitude: externalPoi.longitude,
      address: externalPoi.address ?? null,
      wikipediaUrl: externalPoi.wikipediaUrl ?? null,
      mapillaryId: externalPoi.mapillaryId ?? null,
      mapillaryBearing: externalPoi.mapillaryBearing ?? null,
      mapillaryIsPano: externalPoi.mapillaryIsPano ?? null,
      osmTags: Object.keys(osmTags).length > 0 ? osmTags : null,
      profile,
    })
    .onConflictDoNothing({ target: pois.osmId })
    .returning();

  if (insertResult.length === 0) {
    const existingPoi = await findPoiByOsmId(externalPoi.osmId);
    if (existingPoi) {
      log.warn(
        `Race condition handled — POI already exists: "${existingPoi.name}"`
      );
      return existingPoi;
    }
    throw new Error(
      `Failed to create or retrieve POI with osmId: ${externalPoi.osmId}`
    );
  }

  const insertedPoi = insertResult[0];
  return {
    ...insertedPoi,
    categoryName: category?.name ?? null,
    categorySlug: category?.slug ?? null,
    categoryIcon: category?.icon ?? null,
    categoryColor: category?.color ?? null,
  };
}

/**
 * Generates a remark via Ollama and saves it to the database.
 *
 * @param poi - POI data with category info for remark generation.
 * @returns NextResponse with the generated remark or an error status.
 */
async function generateAndSaveRemark(
  poi: {
    id: string;
    name: string;
    address: string | null;
    locale: string;
    wikipediaUrl: string | null;
    osmTags: Record<string, string> | null;
    profile: unknown;
    latitude: number;
    longitude: number;
    osmId: number | null;
    categoryId: string | null;
    mapillaryId: string | null;
    mapillaryBearing: number | null;
    mapillaryIsPano: boolean | null;
    createdAt: Date | null;
    categoryName: string | null;
    categorySlug: string | null;
    categoryIcon: string | null;
    categoryColor: string | null;
  },
  requestLocale?: string,
) {
  const isHealthy = await checkOllamaHealth();
  if (!isHealthy) {
    return NextResponse.json(
      { error: "AI service unavailable. Please try again later." },
      { status: 503 }
    );
  }

  const categoryName = poi.categoryName || "Hidden Gems";
  const categorySlug = poi.categorySlug ?? "hidden";
  let profile = (poi.profile as PoiProfile | null) ?? null;

  if (!profile?.enrichedAt) {
    log.info(`POI "${poi.name}" not enriched, running on-demand enrichment...`);
    const enrichedProfile = await enrichPoiOnDemand(poi.id);
    if (enrichedProfile) profile = enrichedProfile;
  }

  log.info(`Generating remark for: "${poi.name}" with category: "${categoryName}"`);

  const [poiTagList, contact] = await Promise.all([
    loadTags(poi.id),
    loadContactInfo(poi.id),
  ]);

  const remarkCtx: RemarkPoiContext = {
    poi: {
      id: poi.id,
      osmId: poi.osmId,
      name: poi.name,
      categoryId: poi.categoryId,
      regionId: null,
      latitude: poi.latitude,
      longitude: poi.longitude,
      address: poi.address,
      locale: poi.locale,
      osmType: null,
      osmTags: poi.osmTags,
      profile,
      wikipediaUrl: poi.wikipediaUrl,
      mapillaryId: poi.mapillaryId,
      mapillaryBearing: poi.mapillaryBearing,
      mapillaryIsPano: poi.mapillaryIsPano,
      createdAt: poi.createdAt,
      updatedAt: null,
    },
    categorySlug,
    categoryName,
    profile,
    tags: poiTagList,
    contactInfo: contact,
  };

  const generated = await generateRemark(remarkCtx);

  if (!generated) {
    return NextResponse.json(
      { error: "Insufficient data for remark generation" },
      { status: 422 },
    );
  }

  log.success(`Generated remark — Title: "${generated.title}"`);

  const insertedRemark = await insertRemark({
    poiId: poi.id,
    locale: requestLocale ?? poi.locale,
    remark: generated,
  });

  const isProduction = process.env.NODE_ENV === "production";
  const remarkWithPoi = {
    id: insertedRemark.id,
    poiId: poi.id,
    title: insertedRemark.title,
    teaser: insertedRemark.teaser,
    content: insertedRemark.content,
    localTip: insertedRemark.localTip,
    durationSeconds: insertedRemark.durationSeconds ?? 45,
    createdAt: insertedRemark.createdAt ?? new Date(),
    locale: insertedRemark.locale,
    version: insertedRemark.version,
    isCurrent: insertedRemark.isCurrent,
    ...(isProduction ? {} : { modelId: insertedRemark.modelId, confidence: insertedRemark.confidence }),
    poi: {
      id: poi.id,
      osmId: poi.osmId,
      name: poi.name,
      categoryId: poi.categoryId!,
      latitude: poi.latitude,
      longitude: poi.longitude,
      address: poi.address,
      locale: poi.locale,
      wikipediaUrl: poi.wikipediaUrl,
      mapillaryId: poi.mapillaryId,
      mapillaryBearing: poi.mapillaryBearing,
      mapillaryIsPano: poi.mapillaryIsPano,
      osmTags: poi.osmTags,
      createdAt: poi.createdAt ?? new Date(),
      category: poi.categorySlug
        ? {
            id: poi.categoryId!,
            name: poi.categoryName!,
            slug: poi.categorySlug as CategorySlug,
            icon: poi.categoryIcon!,
            color: poi.categoryColor!,
          }
        : undefined,
    },
  };

  return NextResponse.json({
    remark: remarkWithPoi,
    cached: false,
  });
}
