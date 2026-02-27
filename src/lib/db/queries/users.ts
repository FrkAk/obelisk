import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "../client";
import {
  users,
  userPreferences,
  userSavedPois,
  userVisits,
  pois,
  categories,
} from "../schema";
import type {
  User,
  NewUser,
  UserPreference,
  UserSavedPoi,
  UserVisit,
} from "@/types";

/**
 * Fetch a user by their primary key.
 *
 * Args:
 *     id: UUID of the user.
 *
 * Returns:
 *     The user row or undefined if not found.
 */
export async function getUserById(id: string): Promise<User | undefined> {
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), sql`${users.deletedAt} IS NULL`))
    .limit(1);
  return rows[0];
}

/**
 * Fetch a user by email address.
 *
 * Args:
 *     email: The user's email.
 *
 * Returns:
 *     The user row or undefined if not found.
 */
export async function getUserByEmail(
  email: string,
): Promise<User | undefined> {
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), sql`${users.deletedAt} IS NULL`))
    .limit(1);
  return rows[0];
}

/**
 * Create a new user.
 *
 * Args:
 *     data: Insert payload matching the users table schema.
 *
 * Returns:
 *     The newly created user row.
 */
export async function createUser(
  data: Omit<NewUser, "id" | "createdAt" | "updatedAt">,
): Promise<User> {
  const rows = await db.insert(users).values(data).returning();
  return rows[0];
}

/**
 * Update mutable user fields.
 *
 * Args:
 *     id: UUID of the user.
 *     data: Partial user fields to update.
 *
 * Returns:
 *     The updated user row or undefined if the user was not found.
 */
export async function updateUser(
  id: string,
  data: Partial<
    Pick<
      NewUser,
      | "displayName"
      | "avatarUrl"
      | "locale"
      | "timezone"
      | "role"
      | "emailVerified"
    >
  >,
): Promise<User | undefined> {
  const rows = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return rows[0];
}

/**
 * Upsert user preferences (1:1 with users).
 *
 * Args:
 *     userId: UUID of the user.
 *     prefs: Preference fields to set.
 *
 * Returns:
 *     The upserted preferences row.
 */
export async function updatePreferences(
  userId: string,
  prefs: Omit<Partial<UserPreference>, "userId" | "updatedAt">,
): Promise<UserPreference> {
  const rows = await db
    .insert(userPreferences)
    .values({ userId, ...prefs, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { ...prefs, updatedAt: new Date() },
    })
    .returning();
  return rows[0];
}

/**
 * Get the preferences row for a user.
 *
 * Args:
 *     userId: UUID of the user.
 *
 * Returns:
 *     The preferences row or undefined.
 */
export async function getUserPreferences(
  userId: string,
): Promise<UserPreference | undefined> {
  const rows = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  return rows[0];
}

/**
 * List POIs a user has saved, newest first.
 *
 * Args:
 *     userId: UUID of the user.
 *
 * Returns:
 *     Array of saved-POI join rows including poi name and category.
 */
export async function getUserSavedPoisList(userId: string) {
  return db
    .select({
      id: userSavedPois.id,
      userId: userSavedPois.userId,
      poiId: userSavedPois.poiId,
      note: userSavedPois.note,
      createdAt: userSavedPois.createdAt,
      poiName: pois.name,
      poiLatitude: pois.latitude,
      poiLongitude: pois.longitude,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryColor: categories.color,
      categoryIcon: categories.icon,
    })
    .from(userSavedPois)
    .innerJoin(pois, eq(userSavedPois.poiId, pois.id))
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .where(eq(userSavedPois.userId, userId))
    .orderBy(desc(userSavedPois.createdAt));
}

/**
 * Save a POI for a user (idempotent via unique constraint).
 *
 * Args:
 *     userId: UUID of the user.
 *     poiId: UUID of the POI.
 *     note: Optional personal annotation.
 *
 * Returns:
 *     The saved-POI row.
 */
export async function savePoiForUser(
  userId: string,
  poiId: string,
  note?: string,
): Promise<UserSavedPoi> {
  const rows = await db
    .insert(userSavedPois)
    .values({ userId, poiId, note })
    .onConflictDoNothing()
    .returning();

  if (rows.length === 0) {
    const existing = await db
      .select()
      .from(userSavedPois)
      .where(
        and(
          eq(userSavedPois.userId, userId),
          eq(userSavedPois.poiId, poiId),
        ),
      )
      .limit(1);
    return existing[0];
  }
  return rows[0];
}

/**
 * Remove a saved POI for a user.
 *
 * Args:
 *     userId: UUID of the user.
 *     poiId: UUID of the POI.
 *
 * Returns:
 *     True if a row was deleted.
 */
export async function removeSavedPoi(
  userId: string,
  poiId: string,
): Promise<boolean> {
  const rows = await db
    .delete(userSavedPois)
    .where(
      and(
        eq(userSavedPois.userId, userId),
        eq(userSavedPois.poiId, poiId),
      ),
    )
    .returning();
  return rows.length > 0;
}

/**
 * Record a user visit to a POI.
 *
 * Args:
 *     userId: UUID of the user.
 *     poiId: UUID of the POI.
 *     source: How the visit was detected ('geofence', 'manual', 'checkin').
 *     durationSec: Optional visit duration in seconds.
 *
 * Returns:
 *     The newly created visit row.
 */
export async function recordVisit(
  userId: string,
  poiId: string,
  source: string,
  durationSec?: number,
): Promise<UserVisit> {
  const rows = await db
    .insert(userVisits)
    .values({ userId, poiId, source, durationSec })
    .returning();
  return rows[0];
}

/**
 * Get a user's visit history, newest first.
 *
 * Args:
 *     userId: UUID of the user.
 *     limit: Max rows to return (default 50).
 *
 * Returns:
 *     Array of visit rows with POI name and category info.
 */
export async function getUserVisitHistory(userId: string, limit = 50) {
  return db
    .select({
      id: userVisits.id,
      userId: userVisits.userId,
      poiId: userVisits.poiId,
      visitedAt: userVisits.visitedAt,
      durationSec: userVisits.durationSec,
      source: userVisits.source,
      poiName: pois.name,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(userVisits)
    .innerJoin(pois, eq(userVisits.poiId, pois.id))
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .where(eq(userVisits.userId, userId))
    .orderBy(desc(userVisits.visitedAt))
    .limit(limit);
}
