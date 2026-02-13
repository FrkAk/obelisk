"use server";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { pois, remarks, categories } from "@/lib/db/schema";
import { eq, isNull, and, gte, lte } from "drizzle-orm";
import { generateStory } from "@/lib/ai/storyGenerator";
import type { StoryPoiContext } from "@/lib/ai/storyGenerator";
import { checkOllamaHealth } from "@/lib/ai/ollama";
import { z } from "zod";
import { createLogger } from "@/lib/logger";

const log = createLogger("generate");

const bodySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(500).max(5000).default(2000),
  limit: z.coerce.number().min(1).max(10).default(5),
});

/**
 * Generates stories for POIs without remarks near a location.
 *
 * Args:
 *     lat: Center latitude.
 *     lon: Center longitude.
 *     radius: Radius in meters to search.
 *     limit: Maximum number of stories to generate.
 *
 * Returns:
 *     Array of generated remarks.
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

    const { lat, lon, radius, limit } = parseResult.data;

    const isHealthy = await checkOllamaHealth();
    if (!isHealthy) {
      return NextResponse.json(
        { error: "AI service unavailable. Please try again later." },
        { status: 503 }
      );
    }

    const latDelta = radius / 111320;
    const lonDelta = radius / (111320 * Math.cos(lat * (Math.PI / 180)));

    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;
    const minLon = lon - lonDelta;
    const maxLon = lon + lonDelta;

    const poisWithoutRemarks = await db
      .select({
        id: pois.id,
        name: pois.name,
        address: pois.address,
        wikipediaUrl: pois.wikipediaUrl,
        osmTags: pois.osmTags,
        latitude: pois.latitude,
        longitude: pois.longitude,
        categoryName: categories.name,
        categorySlug: categories.slug,
        categoryColor: categories.color,
      })
      .from(pois)
      .leftJoin(categories, eq(pois.categoryId, categories.id))
      .leftJoin(remarks, eq(pois.id, remarks.poiId))
      .where(
        and(
          isNull(remarks.id),
          gte(pois.latitude, minLat),
          lte(pois.latitude, maxLat),
          gte(pois.longitude, minLon),
          lte(pois.longitude, maxLon)
        )
      )
      .limit(limit);

    if (poisWithoutRemarks.length === 0) {
      return NextResponse.json({
        generated: 0,
        remarks: [],
        message: "All nearby POIs already have stories.",
      });
    }

    const generatedRemarks: Array<{
      id: string;
      poiId: string;
      title: string;
      teaser: string | null;
      content: string;
      localTip: string | null;
      durationSeconds: number | null;
      poi: {
        id: string;
        name: string;
        latitude: number;
        longitude: number;
        categoryName: string | null;
        categorySlug: string | null;
        categoryColor: string | null;
      };
    }> = [];

    for (const poi of poisWithoutRemarks) {
      try {
        const storyCtx: StoryPoiContext = {
          poi: {
            id: poi.id,
            osmId: null,
            name: poi.name,
            categoryId: null,
            regionId: null,
            latitude: poi.latitude,
            longitude: poi.longitude,
            address: poi.address,
            locale: "de-DE",
            osmType: null,
            osmTags: poi.osmTags,
            wikipediaUrl: poi.wikipediaUrl,
            imageUrl: null,
            embedding: null,
            searchVector: null,
            createdAt: null,
            updatedAt: null,
          },
          categorySlug: poi.categorySlug ?? "hidden",
          categoryName: poi.categoryName || "Hidden Gems",
          profile: null,
          tags: [],
        };

        const story = await generateStory(storyCtx);

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

        generatedRemarks.push({
          id: insertedRemark.id,
          poiId: poi.id,
          title: insertedRemark.title,
          teaser: insertedRemark.teaser,
          content: insertedRemark.content,
          localTip: insertedRemark.localTip,
          durationSeconds: insertedRemark.durationSeconds,
          poi: {
            id: poi.id,
            name: poi.name,
            latitude: poi.latitude,
            longitude: poi.longitude,
            categoryName: poi.categoryName,
            categorySlug: poi.categorySlug,
            categoryColor: poi.categoryColor,
          },
        });

        await new Promise((r) => setTimeout(r, 300));
      } catch (error) {
        log.error(`Failed to generate story for ${poi.name}:`, error);
      }
    }

    return NextResponse.json({
      generated: generatedRemarks.length,
      remarks: generatedRemarks,
    });
  } catch (error) {
    log.error("Error generating remarks:", error);
    return NextResponse.json(
      {
        error: "Failed to generate stories",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
