"use server";

import { NextRequest, NextResponse } from "next/server";
import { getRemarkById, versionBumpRemark } from "@/lib/db/queries/remarks";
import { generateStory } from "@/lib/ai/storyGenerator";
import type { StoryPoiContext } from "@/lib/ai/storyGenerator";
import { checkOllamaHealth } from "@/lib/ai/ollama";
import { scrapeWebsite } from "@/lib/web/scraper";
import { enrichPOIWithWebSearch } from "@/lib/web/webSearch";
import { z } from "zod";

const bodySchema = z.object({
  remarkId: z.string().uuid(),
});

/**
 * Regenerates a story for an existing remark using version-bumping.
 * Old remark is kept (is_current=false), new version inserted.
 *
 * Args:
 *     remarkId: The ID of the remark to regenerate.
 *
 * Returns:
 *     The newly generated remark with version bumped.
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

    const existingRemark = await getRemarkById(remarkId);
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

    const websiteUrl =
      existingRemark.poi.osmTags?.website ||
      existingRemark.poi.osmTags?.["contact:website"];

    let websiteContent = null;
    if (websiteUrl) {
      console.log(`[regenerate] Scraping website: ${websiteUrl}`);
      websiteContent = await scrapeWebsite(websiteUrl);
      if (websiteContent.error) {
        console.log(
          `[regenerate] Website scrape failed: ${websiteContent.error}`
        );
      }
    }

    const categoryName = existingRemark.poi.category?.name || "Hidden Gems";

    const webSearchContext = await enrichPOIWithWebSearch({
      name: existingRemark.poi.name,
      category: categoryName,
      address: existingRemark.poi.address,
    });

    console.log(`[regenerate] Web search query: "${webSearchContext.query}"`);
    console.log(
      `[regenerate] Web results: ${webSearchContext.results.length}, scraped: ${webSearchContext.scrapedContent?.length || 0}`
    );

    console.log(
      `[regenerate] Generating new story for: "${existingRemark.poi.name}"`
    );

    const storyCtx: StoryPoiContext = {
      poi: {
        id: existingRemark.poi.id,
        osmId: existingRemark.poi.osmId,
        name: existingRemark.poi.name,
        categoryId: existingRemark.poi.categoryId,
        regionId: null,
        latitude: existingRemark.poi.latitude,
        longitude: existingRemark.poi.longitude,
        address: existingRemark.poi.address,
        locale: "de-DE",
        osmType: null,
        osmTags: existingRemark.poi.osmTags,
        wikipediaUrl: existingRemark.poi.wikipediaUrl,
        imageUrl: existingRemark.poi.imageUrl,
        embedding: null,
        searchVector: null,
        createdAt: existingRemark.poi.createdAt,
        updatedAt: null,
      },
      categorySlug: existingRemark.poi.category?.slug ?? "hidden",
      categoryName,
      profile: null,
      tags: [],
    };

    const story = await generateStory(storyCtx);

    console.log(`[regenerate] Generated new story - Title: "${story.title}"`);

    const newRemark = await versionBumpRemark(remarkId, {
      poiId: existingRemark.poi.id,
      title: story.title.slice(0, 100),
      teaser: story.teaser.slice(0, 100),
      content: story.content,
      localTip: story.localTip,
      durationSeconds: story.durationSeconds,
    });

    const remarkWithPoi = {
      id: newRemark.id,
      poiId: existingRemark.poi.id,
      title: newRemark.title,
      teaser: newRemark.teaser,
      content: newRemark.content,
      localTip: newRemark.localTip,
      durationSeconds: newRemark.durationSeconds ?? 45,
      audioUrl: newRemark.audioUrl,
      createdAt: newRemark.createdAt ?? new Date(),
      locale: newRemark.locale,
      version: newRemark.version,
      isCurrent: newRemark.isCurrent,
      modelId: newRemark.modelId,
      confidence: newRemark.confidence,
      poi: existingRemark.poi,
    };

    return NextResponse.json({
      remark: remarkWithPoi,
    });
  } catch (error) {
    console.error("Error regenerating story:", error);
    return NextResponse.json(
      {
        error: "Failed to regenerate story",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
