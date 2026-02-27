import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getUserSavedPoisList,
  savePoiForUser,
  removeSavedPoi,
} from "@/lib/db/queries/users";
import { createLogger } from "@/lib/logger";

const log = createLogger("users-saved");

const querySchema = z.object({
  userId: z.string().uuid(),
});

const saveSchema = z.object({
  userId: z.string().uuid(),
  poiId: z.string().uuid(),
  note: z.string().max(500).nullable().optional(),
});

const deleteSchema = z.object({
  userId: z.string().uuid(),
  poiId: z.string().uuid(),
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

    const saved = await getUserSavedPoisList(userId);
    return NextResponse.json({ saved, total: saved.length });
  } catch (error) {
    log.error("Error fetching saved POIs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = saveSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const { userId, poiId, note } = parseResult.data;
    const saved = await savePoiForUser(userId, poiId, note ?? undefined);

    return NextResponse.json({ saved }, { status: 201 });
  } catch (error) {
    log.error("Error saving POI:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = deleteSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const { userId, poiId } = parseResult.data;
    const deleted = await removeSavedPoi(userId, poiId);

    if (!deleted) {
      return NextResponse.json(
        { error: "Saved POI not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error("Error removing saved POI:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
