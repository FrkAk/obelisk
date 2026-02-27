import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  recordEngagement,
  getUserEngagementStats,
} from "@/lib/db/queries/engagement";
import { createLogger } from "@/lib/logger";

const log = createLogger("engagement");

const querySchema = z.object({
  userId: z.string().uuid(),
});

const engagementSchema = z.object({
  userId: z.string().uuid(),
  poiId: z.string().uuid().nullable().optional(),
  remarkId: z.string().uuid().nullable().optional(),
  eventType: z.enum([
    "story_read",
    "story_complete",
    "save",
    "share",
    "dismiss",
    "direction",
  ]),
  dwellTimeSec: z.number().int().nonnegative().nullable().optional(),
  scrollDepth: z.number().min(0).max(1).nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const parseResult = querySchema.safeParse({
      userId: request.nextUrl.searchParams.get("userId"),
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const { userId } = parseResult.data;

    const stats = await getUserEngagementStats(userId);
    return NextResponse.json({ stats });
  } catch (error) {
    log.error("Error fetching engagement stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = engagementSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const engagement = await recordEngagement(parseResult.data);
    return NextResponse.json({ engagement }, { status: 201 });
  } catch (error) {
    log.error("Error recording engagement:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
