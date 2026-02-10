import { eq, sql, desc } from "drizzle-orm";
import { db } from "../client";
import { userEngagement } from "../schema";
import type { UserEngagement, NewUserEngagement } from "@/types";

/**
 * Record a user engagement event (story read, save, share, dismiss, etc.).
 *
 * Args:
 *     data: Engagement event payload.
 *
 * Returns:
 *     The newly created engagement row.
 */
export async function recordEngagement(
  data: Omit<NewUserEngagement, "id" | "createdAt">,
): Promise<UserEngagement> {
  const rows = await db.insert(userEngagement).values(data).returning();
  return rows[0];
}

/**
 * Get aggregated engagement stats for a user.
 *
 * Args:
 *     userId: UUID of the user.
 *
 * Returns:
 *     Object with counts per event type, total dwell time, and avg scroll depth.
 */
export async function getUserEngagementStats(userId: string) {
  const rows = await db
    .select({
      eventType: userEngagement.eventType,
      count: sql<number>`count(*)::int`,
      totalDwellTimeSec: sql<number>`coalesce(sum(${userEngagement.dwellTimeSec}), 0)::int`,
      avgScrollDepth: sql<number>`coalesce(avg(${userEngagement.scrollDepth}), 0)::real`,
    })
    .from(userEngagement)
    .where(eq(userEngagement.userId, userId))
    .groupBy(userEngagement.eventType);

  return rows;
}

/**
 * Get aggregated engagement stats for a specific POI.
 *
 * Args:
 *     poiId: UUID of the POI.
 *
 * Returns:
 *     Object with counts per event type, total dwell time, and avg scroll depth.
 */
export async function getPoiEngagementStats(poiId: string) {
  const rows = await db
    .select({
      eventType: userEngagement.eventType,
      count: sql<number>`count(*)::int`,
      totalDwellTimeSec: sql<number>`coalesce(sum(${userEngagement.dwellTimeSec}), 0)::int`,
      avgScrollDepth: sql<number>`coalesce(avg(${userEngagement.scrollDepth}), 0)::real`,
    })
    .from(userEngagement)
    .where(eq(userEngagement.poiId, poiId))
    .groupBy(userEngagement.eventType);

  return rows;
}

/**
 * Get recent engagement events for a user.
 *
 * Args:
 *     userId: UUID of the user.
 *     limit: Max rows to return (default 50).
 *
 * Returns:
 *     Array of engagement event rows, newest first.
 */
export async function getUserRecentEngagement(
  userId: string,
  limit = 50,
) {
  return db
    .select()
    .from(userEngagement)
    .where(eq(userEngagement.userId, userId))
    .orderBy(desc(userEngagement.createdAt))
    .limit(limit);
}
