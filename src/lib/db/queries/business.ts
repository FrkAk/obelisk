import { eq, desc, sql } from "drizzle-orm";
import { db } from "../client";
import {
  businessAccounts,
  adCampaigns,
  adImpressions,
} from "../schema";
import type {
  BusinessAccount,
  NewBusinessAccount,
  AdCampaign,
  NewAdCampaign,
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

