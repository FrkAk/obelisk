import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getUserPreferences,
  updatePreferences,
} from "@/lib/db/queries/users";
import { createLogger } from "@/lib/logger";

const log = createLogger("users-prefs");

const updatePrefsSchema = z.object({
  userId: z.string().uuid(),
  favoriteCategories: z.array(z.string().uuid()).nullable().optional(),
  cuisinePreferences: z.array(z.string().max(50)).nullable().optional(),
  priceRange: z.enum(["$", "$$", "$$$", "$$$$"]).nullable().optional(),
  dietaryNeeds: z.array(z.string().max(50)).nullable().optional(),
  explorationStyle: z
    .enum(["adventurous", "comfort", "balanced"])
    .nullable()
    .optional(),
  maxWalkDistance: z.number().int().positive().nullable().optional(),
  notificationEnabled: z.boolean().optional(),
  storyLanguage: z.string().max(10).nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing 'userId' query parameter" },
        { status: 400 },
      );
    }

    const prefs = await getUserPreferences(userId);
    return NextResponse.json({ preferences: prefs ?? null });
  } catch (error) {
    log.error("Error fetching preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = updatePrefsSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const { userId, ...prefs } = parseResult.data;
    const updated = await updatePreferences(userId, prefs);

    return NextResponse.json({ preferences: updated });
  } catch (error) {
    log.error("Error updating preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
