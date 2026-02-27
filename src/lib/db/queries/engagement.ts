import { eq, sql } from "drizzle-orm";
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

