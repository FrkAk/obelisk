"use server";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { pois, remarks, categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateStory } from "@/lib/ai/storyGenerator";
import type { StoryPoiContext } from "@/lib/ai/storyGenerator";
import { checkOllamaHealth } from "@/lib/ai/ollama";
import { scrapeWebsite } from "@/lib/web/scraper";
import { enrichPOIWithWebSearch, translateKeywords, FALLBACK_KEYWORDS } from "@/lib/web/webSearch";
import { fetchWikipediaSummary } from "@/lib/web/wikipedia";
import { z } from "zod";
import { createLogger } from "@/lib/logger";
import type { CategorySlug } from "@/types";
import { getCurrentRemarkForPoi } from "@/lib/db/queries/remarks";

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
  imageUrl: z.string().optional(),
  source: z.enum(["nominatim", "overpass"]),
});

const bodySchema = z.object({
  poi: externalPoiSchema,
});

const CATEGORY_MAPPING: Record<string, CategorySlug> = {
  food: "food",
  history: "history",
  art: "art",
  nature: "nature",
  architecture: "architecture",
  hidden: "hidden",
  views: "views",
  culture: "culture",
  shopping: "shopping",
  nightlife: "nightlife",
  sports: "sports",
  health: "health",
  transport: "transport",
  education: "education",
  services: "services",
  cafe: "food",
  restaurant: "food",
  fast_food: "food",
  biergarten: "food",
  bar: "nightlife",
  pub: "nightlife",
  nightclub: "nightlife",
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
  library: "education",
  university: "education",
  school: "education",
  college: "education",
  viewpoint: "views",
  attraction: "hidden",
  fountain: "hidden",
  food_and_drink: "food",
  religion: "architecture",
  park_like: "nature",
  arts_and_entertainment: "culture",
  historic: "history",
  hospital: "health",
  pharmacy: "health",
  clinic: "health",
  doctors: "health",
  police: "services",
  fire_station: "services",
  bank: "services",
  post_office: "services",
  shop: "shopping",
  clothes: "shopping",
  supermarket: "shopping",
  stadium: "sports",
  sports_centre: "sports",
  swimming_pool: "sports",
  bus_station: "transport",
  station: "transport",
  parking: "transport",
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
  log.info("=== API CALLED ===");

  try {
    const body = await request.json();
    const parseResult = bodySchema.safeParse(body);

    if (!parseResult.success) {
      log.warn("Invalid parameters:", parseResult.error.flatten());
      return NextResponse.json(
        { error: "Invalid parameters", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { poi: externalPoi } = parseResult.data;

    log.info(
      `Request for: "${externalPoi.name}" (osmId: ${externalPoi.osmId}, website: ${externalPoi.website || "none"})`
    );

    const existingPoi = await findPoiByOsmId(externalPoi.osmId);

    if (existingPoi) {
      log.info(
        `Found existing POI in DB: "${existingPoi.name}" (id: ${existingPoi.id})`
      );

      const existingRemark = await getCurrentRemarkForPoi(existingPoi.id);

      if (existingRemark) {
        log.success(
          `Returning cached remark: "${existingRemark.title}" for "${existingRemark.poi.name}"`
        );
        return NextResponse.json({
          remark: existingRemark,
          cached: true,
        });
      }

      log.info(
        `No remark exists, generating new one for: "${existingPoi.name}"`
      );
      return await generateAndSaveRemark(existingPoi, externalPoi.website);
    }

    log.info(`POI not in DB, creating new: "${externalPoi.name}"`);
    const newPoi = await createPoiFromExternal(externalPoi);
    return await generateAndSaveRemark(newPoi, externalPoi.website);
  } catch (error) {
    log.error("Error:", error);
    const errorMessage =
      error instanceof Error
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
      locale: pois.locale,
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

async function createPoiFromExternal(
  externalPoi: z.infer<typeof externalPoiSchema>
) {
  const categorySlug =
    CATEGORY_MAPPING[externalPoi.category.toLowerCase()] || "hidden";

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

async function generateAndSaveRemark(
  poi: {
    id: string;
    name: string;
    address: string | null;
    locale: string;
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

  let wikipediaSummary = null;
  if (poi.wikipediaUrl) {
    wikipediaSummary = await fetchWikipediaSummary(poi.wikipediaUrl);
    if (wikipediaSummary) {
      log.success(`Wikipedia: "${wikipediaSummary.title}" — ${wikipediaSummary.description}`);
    } else {
      log.warn(`Wikipedia fetch failed for: ${poi.wikipediaUrl}`);
    }
  }

  let websiteContent = null;
  if (websiteUrl) {
    log.info(`Scraping website: ${websiteUrl}`);
    websiteContent = await scrapeWebsite(websiteUrl);
    if (websiteContent.error) {
      log.warn(`Website scrape failed: ${websiteContent.error}`);
    } else {
      log.success(
        `Scraped content — Title: "${websiteContent.title}", Desc: "${websiteContent.description?.slice(0, 100)}..."`
      );
    }
  } else {
    log.info(`No website URL provided for: "${poi.name}"`);
  }

  const categoryName = poi.categoryName || "Hidden Gems";
  const categorySlug = poi.categorySlug ?? "hidden";
  const poiLang = poi.locale?.split("-")[0] ?? "en";

  const englishKeywords = FALLBACK_KEYWORDS[categorySlug] ?? "interesting facts information";
  const translatedKeywords = poiLang !== "en"
    ? await translateKeywords(englishKeywords, poiLang)
    : englishKeywords;

  const webSearchContext = await enrichPOIWithWebSearch(
    { name: poi.name, category: categoryName, address: poi.address },
    true,
    { language: poiLang, keywords: translatedKeywords },
  );

  log.info(`Web search query: "${webSearchContext.query}" (source: ${webSearchContext.meta.source})`);
  log.info(
    `Web results: ${webSearchContext.results.length}, scraped: ${webSearchContext.scrapedContent?.length || 0}`
  );
  if (webSearchContext.meta.rateLimited) {
    log.warn("Search was rate limited");
  }

  log.info(
    `Generating story for: "${poi.name}" with category: "${categoryName}" (wikipedia: ${wikipediaSummary ? "yes" : "no"})`
  );

  const storyCtx: StoryPoiContext = {
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
      wikipediaUrl: poi.wikipediaUrl,
      imageUrl: poi.imageUrl,
      embedding: null,
      searchVector: null,
      createdAt: poi.createdAt,
      updatedAt: null,
    },
    categorySlug,
    categoryName,
    profile: null,
    tags: [],
  };

  const story = await generateStory(storyCtx);

  log.success(`Generated story — Title: "${story.title}"`);

  const [insertedRemark] = await db
    .insert(remarks)
    .values({
      poiId: poi.id,
      title: story.title.slice(0, 100),
      teaser: story.teaser.slice(0, 100),
      content: story.content,
      localTip: story.localTip,
      durationSeconds: story.durationSeconds,
      version: 1,
      isCurrent: true,
    })
    .returning();

  const remarkWithPoi = {
    id: insertedRemark.id,
    poiId: poi.id,
    title: insertedRemark.title,
    teaser: insertedRemark.teaser,
    content: insertedRemark.content,
    localTip: insertedRemark.localTip,
    durationSeconds: insertedRemark.durationSeconds ?? 45,
    audioUrl: insertedRemark.audioUrl,
    createdAt: insertedRemark.createdAt ?? new Date(),
    locale: insertedRemark.locale,
    version: insertedRemark.version,
    isCurrent: insertedRemark.isCurrent,
    modelId: insertedRemark.modelId,
    confidence: insertedRemark.confidence,
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
