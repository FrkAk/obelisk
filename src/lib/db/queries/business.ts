import { eq, desc, sql, and, gte } from "drizzle-orm";
import { db } from "../client";
import {
  businessAccounts,
  adCampaigns,
  adImpressions,
  recommendations,
  pois,
  categories,
} from "../schema";
import type {
  BusinessAccount,
  NewBusinessAccount,
  AdCampaign,
  NewAdCampaign,
  AdImpression,
  NewAdImpression,
  Recommendation,
  NewRecommendation,
} from "@/types";

// ---------------------------------------------------------------------------
// Business Accounts
// ---------------------------------------------------------------------------

/**
 * Create a new business account linked to a user.
 *
 * Args:
 *     userId: UUID of the owning user.
 *     data: Business account fields.
 *
 * Returns:
 *     The newly created business account row.
 */
export async function createBusinessAccount(
  userId: string,
  data: Omit<NewBusinessAccount, "id" | "userId" | "createdAt">,
): Promise<BusinessAccount> {
  const rows = await db
    .insert(businessAccounts)
    .values({ ...data, userId })
    .returning();
  return rows[0];
}

/**
 * Fetch a business account by its primary key.
 *
 * Args:
 *     id: UUID of the business account.
 *
 * Returns:
 *     The business account row or undefined.
 */
export async function getBusinessAccount(
  id: string,
): Promise<BusinessAccount | undefined> {
  const rows = await db
    .select()
    .from(businessAccounts)
    .where(eq(businessAccounts.id, id))
    .limit(1);
  return rows[0];
}

/**
 * Fetch the business account owned by a specific user.
 *
 * Args:
 *     userId: UUID of the user.
 *
 * Returns:
 *     The business account row or undefined.
 */
export async function getBusinessByUserId(
  userId: string,
): Promise<BusinessAccount | undefined> {
  const rows = await db
    .select()
    .from(businessAccounts)
    .where(eq(businessAccounts.userId, userId))
    .limit(1);
  return rows[0];
}

// ---------------------------------------------------------------------------
// Ad Campaigns
// ---------------------------------------------------------------------------

/**
 * Create a new ad campaign for a business.
 *
 * Args:
 *     businessId: UUID of the business account.
 *     data: Campaign fields.
 *
 * Returns:
 *     The newly created campaign row.
 */
export async function createCampaign(
  businessId: string,
  data: Omit<NewAdCampaign, "id" | "businessId" | "createdAt" | "spentAmount">,
): Promise<AdCampaign> {
  const rows = await db
    .insert(adCampaigns)
    .values({ ...data, businessId })
    .returning();
  return rows[0];
}

/**
 * Fetch a campaign by its primary key.
 *
 * Args:
 *     id: UUID of the campaign.
 *
 * Returns:
 *     The campaign row or undefined.
 */
export async function getCampaign(
  id: string,
): Promise<AdCampaign | undefined> {
  const rows = await db
    .select()
    .from(adCampaigns)
    .where(eq(adCampaigns.id, id))
    .limit(1);
  return rows[0];
}

/**
 * List all campaigns for a business, newest first.
 *
 * Args:
 *     businessId: UUID of the business account.
 *
 * Returns:
 *     Array of campaign rows.
 */
export async function getCampaignsByBusiness(
  businessId: string,
): Promise<AdCampaign[]> {
  return db
    .select()
    .from(adCampaigns)
    .where(eq(adCampaigns.businessId, businessId))
    .orderBy(desc(adCampaigns.createdAt));
}

// ---------------------------------------------------------------------------
// Ad Impressions
// ---------------------------------------------------------------------------

/**
 * Record an ad impression/click event and increment the campaign spent amount.
 *
 * Args:
 *     campaignId: UUID of the campaign.
 *     data: Impression event fields.
 *
 * Returns:
 *     The newly created impression row.
 */
export async function recordImpression(
  campaignId: string,
  data: Omit<NewAdImpression, "id" | "campaignId" | "createdAt">,
): Promise<AdImpression> {
  const costCents = data.costCents ?? 0;

  const rows = await db
    .insert(adImpressions)
    .values({ ...data, campaignId })
    .returning();

  if (costCents > 0) {
    await db
      .update(adCampaigns)
      .set({
        spentAmount: sql`${adCampaigns.spentAmount} + ${costCents}`,
      })
      .where(eq(adCampaigns.id, campaignId));
  }

  return rows[0];
}

/**
 * Get aggregated stats for a campaign (impressions, clicks, total spend).
 *
 * Args:
 *     campaignId: UUID of the campaign.
 *
 * Returns:
 *     Object with per-event-type counts and total cost.
 */
export async function getCampaignStats(campaignId: string) {
  const rows = await db
    .select({
      eventType: adImpressions.eventType,
      count: sql<number>`count(*)::int`,
      totalCostCents: sql<number>`coalesce(sum(${adImpressions.costCents}), 0)::int`,
    })
    .from(adImpressions)
    .where(eq(adImpressions.campaignId, campaignId))
    .groupBy(adImpressions.eventType);

  return rows;
}

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

/**
 * Create a recommendation entry for a user.
 *
 * Args:
 *     data: Recommendation payload.
 *
 * Returns:
 *     The newly created recommendation row.
 */
export async function createRecommendation(
  data: Omit<NewRecommendation, "id" | "createdAt" | "served" | "servedAt">,
): Promise<Recommendation> {
  const rows = await db
    .insert(recommendations)
    .values(data)
    .onConflictDoUpdate({
      target: [recommendations.userId, recommendations.poiId],
      set: {
        score: data.score,
        reason: data.reason,
        campaignId: data.campaignId,
        expiresAt: data.expiresAt,
        served: false,
        servedAt: null,
      },
    })
    .returning();
  return rows[0];
}

/**
 * Get active (non-expired, unserved) recommendations for a user, highest score first.
 * Includes sponsored recommendations (those with a campaign_id).
 *
 * Args:
 *     userId: UUID of the user.
 *     limit: Max rows to return (default 10).
 *
 * Returns:
 *     Array of recommendation rows with POI name and category info.
 */
export async function getRecommendationsForUser(
  userId: string,
  limit = 10,
) {
  const now = new Date();

  return db
    .select({
      id: recommendations.id,
      userId: recommendations.userId,
      poiId: recommendations.poiId,
      score: recommendations.score,
      reason: recommendations.reason,
      campaignId: recommendations.campaignId,
      expiresAt: recommendations.expiresAt,
      served: recommendations.served,
      servedAt: recommendations.servedAt,
      createdAt: recommendations.createdAt,
      poiName: pois.name,
      poiLatitude: pois.latitude,
      poiLongitude: pois.longitude,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryColor: categories.color,
    })
    .from(recommendations)
    .innerJoin(pois, eq(recommendations.poiId, pois.id))
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .where(
      and(
        eq(recommendations.userId, userId),
        eq(recommendations.served, false),
        gte(recommendations.expiresAt, now),
      ),
    )
    .orderBy(desc(recommendations.score))
    .limit(limit);
}
