"use server";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { pois, remarks, categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateEnhancedStory } from "@/lib/ai/storyGenerator";
import { checkOllamaHealth } from "@/lib/ai/ollama";
import { scrapeWebsite } from "@/lib/web/scraper";
import { z } from "zod";
import type { CategorySlug, Remark, Poi } from "@/types";

const bodySchema = z.object({
  remarkId: z.string().uuid(),
});

type RemarkWithPoi = Remark & { poi: Poi };

/**
 * Regenerates a story for an existing remark.
 * Deletes the old remark and creates a new one with fresh AI-generated content.
 *
 * Args:
 *     remarkId: The ID of the remark to regenerate.
 *
 * Returns:
 *     The newly generated remark.
 */
export async function POST(request: NextRequest) {
  console.log("[regenerate] === API CALLED ===");

  try {
    const body = await request.json();
    const parseResult = bodySchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { remarkId } = parseResult.data;

    console.log(`[regenerate] Regenerating remark: ${remarkId}`);

    const existingRemark = await getRemarkWithPoi(remarkId);
    if (!existingRemark) {
      return NextResponse.json(
        { error: "Remark not found" },
        { status: 404 }
      );
    }

    const isHealthy = await checkOllamaHealth();
    if (!isHealthy) {
      return NextResponse.json(
        { error: "AI service unavailable. Please try again later." },
        { status: 503 }
      );
    }

    const websiteUrl = existingRemark.poi.osmTags?.website ||
      existingRemark.poi.osmTags?.["contact:website"];

    let websiteContent = null;
    if (websiteUrl) {
      console.log(`[regenerate] Scraping website: ${websiteUrl}`);
      websiteContent = await scrapeWebsite(websiteUrl);
      if (websiteContent.error) {
        console.log(`[regenerate] Website scrape failed: ${websiteContent.error}`);
      }
    }

    const categoryName = existingRemark.poi.category?.name || "Hidden Gems";

    console.log(`[regenerate] Generating new story for: "${existingRemark.poi.name}"`);

    const story = await generateEnhancedStory({
      name: existingRemark.poi.name,
      categoryName,
      address: existingRemark.poi.address,
      wikipediaUrl: existingRemark.poi.wikipediaUrl,
      osmTags: existingRemark.poi.osmTags,
      websiteContent,
    });

    console.log(`[regenerate] Generated new story - Title: "${story.title}"`);

    await db.delete(remarks).where(eq(remarks.id, remarkId));

    const [newRemark] = await db
      .insert(remarks)
      .values({
        poiId: existingRemark.poi.id,
        title: story.title.slice(0, 100),
        teaser: story.teaser.slice(0, 100),
        content: story.content,
        localTip: story.localTip,
        durationSeconds: story.durationSeconds,
      })
      .returning();

    const remarkWithPoi: RemarkWithPoi = {
      id: newRemark.id,
      poiId: existingRemark.poi.id,
      title: newRemark.title,
      teaser: newRemark.teaser,
      content: newRemark.content,
      localTip: newRemark.localTip,
      durationSeconds: newRemark.durationSeconds ?? 45,
      audioUrl: newRemark.audioUrl,
      createdAt: newRemark.createdAt ?? new Date(),
      poi: existingRemark.poi,
    };

    return NextResponse.json({
      remark: remarkWithPoi,
    });
  } catch (error) {
    console.error("Error regenerating story:", error);
    return NextResponse.json(
      { error: "Failed to regenerate story", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function getRemarkWithPoi(remarkId: string): Promise<RemarkWithPoi | null> {
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
    .where(eq(remarks.id, remarkId))
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
