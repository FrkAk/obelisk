import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { pois } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getRemarkById, versionBumpRemark } from "@/lib/db/queries/remarks";
import { generateStory } from "@/lib/ai/storyGenerator";
import type { StoryPoiContext } from "@/lib/ai/storyGenerator";
import { checkOllamaHealth } from "@/lib/ai/ollama";
import { loadTags, loadContactInfo } from "@/lib/db/queries/pois";
import { z } from "zod";
import { createLogger } from "@/lib/logger";
import type { PoiProfile } from "@/types";

const log = createLogger("regenerate");

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

    log.info(`Regenerating remark: ${remarkId}`);

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

    const categoryName = existingRemark.poi.category?.name || "Hidden Gems";
    const categorySlug = existingRemark.poi.category?.slug ?? "hidden";

    const poiRow = await db
      .select({ profile: pois.profile })
      .from(pois)
      .where(eq(pois.id, existingRemark.poi.id))
      .limit(1);

    const profile = (poiRow[0]?.profile as PoiProfile | null) ?? null;

    log.info(`Generating new story for: "${existingRemark.poi.name}"`);

    const [poiTagList, contact] = await Promise.all([
      loadTags(existingRemark.poi.id),
      loadContactInfo(existingRemark.poi.id),
    ]);

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
        locale: existingRemark.poi.locale,
        osmType: null,
        osmTags: existingRemark.poi.osmTags,
        profile,
        wikipediaUrl: existingRemark.poi.wikipediaUrl,
        imageUrl: existingRemark.poi.imageUrl,
        embedding: null,
        searchVector: null,
        createdAt: existingRemark.poi.createdAt,
        updatedAt: null,
      },
      categorySlug,
      categoryName,
      profile,
      tags: poiTagList,
      contactInfo: contact,
    };

    const story = await generateStory(storyCtx);

    if (!story) {
      return NextResponse.json(
        { error: "Insufficient data for story regeneration" },
        { status: 422 },
      );
    }

    log.success(`Generated new story - Title: "${story.title}"`);

    const newRemark = await versionBumpRemark(
      remarkId,
      existingRemark.poi.id,
      story,
    );

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
    log.error("Error regenerating story:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
