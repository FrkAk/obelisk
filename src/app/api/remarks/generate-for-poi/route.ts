"use server";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { pois, remarks, categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateEnhancedStory } from "@/lib/ai/storyGenerator";
import { checkOllamaHealth } from "@/lib/ai/ollama";
import { scrapeWebsite } from "@/lib/web/scraper";
import { enrichPOIWithWebSearch } from "@/lib/web/webSearch";
import { z } from "zod";
import type { CategorySlug, Remark, Poi } from "@/types";

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
  imageUrl: z.string().optional(),
  source: z.enum(["nominatim", "overpass"]),
});

const bodySchema = z.object({
  poi: externalPoiSchema,
});

type RemarkWithPoi = Remark & { poi: Poi };

const CATEGORY_MAPPING: Record<string, CategorySlug> = {
  food: "food",
  history: "history",
  art: "art",
  nature: "nature",
  architecture: "architecture",
  hidden: "hidden",
  views: "views",
  culture: "culture",
  cafe: "food",
  restaurant: "food",
  bar: "food",
  pub: "food",
  fast_food: "food",
  biergarten: "food",
  museum: "art",
  gallery: "art",
  park: "nature",
  garden: "nature",
  zoo: "nature",
  church: "architecture",
  cathedral: "architecture",
  place_of_worship: "architecture",
  mosque: "architecture",
  synagogue: "architecture",
  temple: "architecture",
  castle: "history",
  monument: "history",
  memorial: "history",
  ruins: "history",
  theatre: "culture",
  cinema: "culture",
  library: "culture",
  university: "culture",
  viewpoint: "views",
  attraction: "hidden",
  fountain: "hidden",
  food_and_drink: "food",
  religion: "architecture",
  park_like: "nature",
  arts_and_entertainment: "culture",
  historic: "history",
  education: "culture",
};

/**
 * Generates a story for a specific external POI.
 *
 * Args:
 *     poi: External POI data.
 *
 * Returns:
 *     Generated remark with POI data, or cached remark if exists.
 */
export async function POST(request: NextRequest) {
  console.log("[generate-for-poi] === API CALLED ===");

  try {
    const body = await request.json();
    const parseResult = bodySchema.safeParse(body);

    if (!parseResult.success) {
      console.log("[generate-for-poi] Invalid parameters:", parseResult.error.flatten());
      return NextResponse.json(
        { error: "Invalid parameters", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { poi: externalPoi } = parseResult.data;

    console.log(`[generate-for-poi] Request for: "${externalPoi.name}" (osmId: ${externalPoi.osmId}, website: ${externalPoi.website || "none"})`);

    const existingPoi = await findPoiByOsmId(externalPoi.osmId);

    if (existingPoi) {
      console.log(`[generate-for-poi] Found existing POI in DB: "${existingPoi.name}" (id: ${existingPoi.id})`);

      const existingRemark = await findRemarkForPoi(existingPoi.id);

      if (existingRemark) {
        console.log(`[generate-for-poi] === RETURNING CACHED ===`);
        console.log(`[generate-for-poi] Remark title: "${existingRemark.title}"`);
        console.log(`[generate-for-poi] Remark POI name: "${existingRemark.poi.name}"`);
        console.log(`[generate-for-poi] Remark content preview: "${existingRemark.content.slice(0, 80)}..."`);
        return NextResponse.json({
          remark: existingRemark,
          cached: true,
        });
      }

      console.log(`[generate-for-poi] No remark exists, generating new one for: "${existingPoi.name}"`);
      return await generateAndSaveRemark(existingPoi, externalPoi.website);
    }

    console.log(`[generate-for-poi] POI not in DB, creating new: "${externalPoi.name}"`);
    const newPoi = await createPoiFromExternal(externalPoi);
    return await generateAndSaveRemark(newPoi, externalPoi.website);
  } catch (error) {
    console.error("[generate-for-poi] Error:", error);
    const errorMessage = error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : JSON.stringify(error) || "Unknown error";
    return NextResponse.json(
      { error: "Failed to generate story", details: errorMessage },
      { status: 500 }
    );
  }
}

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
      wikipediaUrl: pois.wikipediaUrl,
      imageUrl: pois.imageUrl,
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

async function findRemarkForPoi(poiId: string): Promise<RemarkWithPoi | null> {
  const results = await db
    .select({
      remarkId: remarks.id,
      remarkPoiId: remarks.poiId,
      remarkTitle: remarks.title,
      remarkTeaser: remarks.teaser,
      remarkContent: remarks.content,
      remarkLocalTip: remarks.localTip,
      remarkDurationSeconds: remarks.durationSeconds,
      remarkAudioUrl: remarks.audioUrl,
      remarkCreatedAt: remarks.createdAt,
      poiId: pois.id,
      poiOsmId: pois.osmId,
      poiName: pois.name,
      poiCategoryId: pois.categoryId,
      poiLatitude: pois.latitude,
      poiLongitude: pois.longitude,
      poiAddress: pois.address,
      poiWikipediaUrl: pois.wikipediaUrl,
      poiImageUrl: pois.imageUrl,
      poiOsmTags: pois.osmTags,
      poiCreatedAt: pois.createdAt,
      categoryId: categories.id,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
    })
    .from(remarks)
    .innerJoin(pois, eq(remarks.poiId, pois.id))
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .where(eq(remarks.poiId, poiId))
    .limit(1);

  const row = results[0];
  if (!row) return null;

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
    poi: {
      id: row.poiId,
      osmId: row.poiOsmId,
      name: row.poiName,
      categoryId: row.poiCategoryId!,
      latitude: row.poiLatitude,
      longitude: row.poiLongitude,
      address: row.poiAddress,
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

async function createPoiFromExternal(externalPoi: z.infer<typeof externalPoiSchema>) {
  const categorySlug = CATEGORY_MAPPING[externalPoi.category.toLowerCase()] || "hidden";

  const allCategories = await db.select().from(categories);
  const category = allCategories.find((c) => c.slug === categorySlug);

  const osmTags: Record<string, string> = {};
  if (externalPoi.openingHours) osmTags.opening_hours = externalPoi.openingHours;
  if (externalPoi.phone) osmTags.phone = externalPoi.phone;
  if (externalPoi.website) osmTags.website = externalPoi.website;
  if (externalPoi.cuisine) osmTags.cuisine = externalPoi.cuisine;
  if (externalPoi.hasWifi) osmTags.internet_access = "wlan";
  if (externalPoi.hasOutdoorSeating) osmTags.outdoor_seating = "yes";

  const insertResult = await db
    .insert(pois)
    .values({
      osmId: externalPoi.osmId,
      name: externalPoi.name,
      categoryId: category?.id ?? null,
      latitude: externalPoi.latitude,
      longitude: externalPoi.longitude,
      address: externalPoi.address ?? null,
      imageUrl: externalPoi.imageUrl ?? null,
      osmTags: Object.keys(osmTags).length > 0 ? osmTags : null,
    })
    .onConflictDoNothing({ target: pois.osmId })
    .returning();

  if (insertResult.length === 0) {
    const existingPoi = await findPoiByOsmId(externalPoi.osmId);
    if (existingPoi) {
      console.log(`[generate-for-poi] Race condition handled - POI already exists: "${existingPoi.name}"`);
      return existingPoi;
    }
    throw new Error(`Failed to create or retrieve POI with osmId: ${externalPoi.osmId}`);
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

async function generateAndSaveRemark(
  poi: {
    id: string;
    name: string;
    address: string | null;
    wikipediaUrl: string | null;
    osmTags: Record<string, string> | null;
    latitude: number;
    longitude: number;
    osmId: number | null;
    categoryId: string | null;
    imageUrl: string | null;
    createdAt: Date | null;
    categoryName: string | null;
    categorySlug: string | null;
    categoryIcon: string | null;
    categoryColor: string | null;
  },
  websiteUrl?: string
) {
  const isHealthy = await checkOllamaHealth();
  if (!isHealthy) {
    return NextResponse.json(
      { error: "AI service unavailable. Please try again later." },
      { status: 503 }
    );
  }

  let websiteContent = null;
  if (websiteUrl) {
    console.log(`[generate-for-poi] Scraping website: ${websiteUrl}`);
    websiteContent = await scrapeWebsite(websiteUrl);
    if (websiteContent.error) {
      console.log(`[generate-for-poi] Website scrape failed: ${websiteContent.error}`);
    } else {
      console.log(`[generate-for-poi] Scraped content - Title: "${websiteContent.title}", Desc: "${websiteContent.description?.slice(0, 100)}..."`);
    }
  } else {
    console.log(`[generate-for-poi] No website URL provided for: "${poi.name}"`);
  }

  const categoryName = poi.categoryName || "Hidden Gems";

  const webSearchContext = await enrichPOIWithWebSearch({
    name: poi.name,
    category: categoryName,
    address: poi.address,
  });

  console.log(`[generate-for-poi] Web search query: "${webSearchContext.query}"`);
  console.log(`[generate-for-poi] Web results: ${webSearchContext.results.length}, scraped: ${webSearchContext.scrapedContent?.length || 0}`);

  console.log(`[generate-for-poi] Generating story for: "${poi.name}" with category: "${categoryName}"`);

  const story = await generateEnhancedStory({
    name: poi.name,
    categoryName,
    address: poi.address,
    latitude: poi.latitude,
    longitude: poi.longitude,
    wikipediaUrl: poi.wikipediaUrl,
    osmTags: poi.osmTags,
    websiteContent,
    webSearchContext,
  });

  console.log(`[generate-for-poi] Generated story - Title: "${story.title}", Content preview: "${story.content.slice(0, 100)}..."`);

  const [insertedRemark] = await db
    .insert(remarks)
    .values({
      poiId: poi.id,
      title: story.title.slice(0, 100),
      teaser: story.teaser.slice(0, 100),
      content: story.content,
      localTip: story.localTip,
      durationSeconds: story.durationSeconds,
    })
    .returning();

  const remarkWithPoi: RemarkWithPoi = {
    id: insertedRemark.id,
    poiId: poi.id,
    title: insertedRemark.title,
    teaser: insertedRemark.teaser,
    content: insertedRemark.content,
    localTip: insertedRemark.localTip,
    durationSeconds: insertedRemark.durationSeconds ?? 45,
    audioUrl: insertedRemark.audioUrl,
    createdAt: insertedRemark.createdAt ?? new Date(),
    poi: {
      id: poi.id,
      osmId: poi.osmId,
      name: poi.name,
      categoryId: poi.categoryId!,
      latitude: poi.latitude,
      longitude: poi.longitude,
      address: poi.address,
      wikipediaUrl: poi.wikipediaUrl,
      imageUrl: poi.imageUrl,
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
