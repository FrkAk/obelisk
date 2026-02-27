import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createCampaign,
  getCampaign,
  getCampaignsByBusiness,
  getCampaignStats,
} from "@/lib/db/queries/business";
import { createLogger } from "@/lib/logger";

const log = createLogger("campaigns");

const querySchema = z
  .object({
    id: z.string().uuid().optional(),
    businessId: z.string().uuid().optional(),
    stats: z.enum(["true", "false"]).optional(),
  })
  .refine((data) => data.id || data.businessId, {
    message: "Provide 'id' or 'businessId' query parameter",
  });

const createCampaignSchema = z.object({
  businessId: z.string().uuid(),
  poiId: z.string().uuid(),
  name: z.string().min(1).max(255),
  campaignType: z.enum(["promoted_pin", "featured_story", "boosted_search"]),
  pricingModel: z.enum(["cpc", "cpm", "flat"]),
  bidAmount: z.number().int().positive(),
  dailyBudget: z.number().int().positive().nullable().optional(),
  totalBudget: z.number().int().positive(),
  targetRadiusM: z.number().int().positive().nullable().optional(),
  targetCategories: z.array(z.string().uuid()).nullable().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const parseResult = querySchema.safeParse({
      id: searchParams.get("id") ?? undefined,
      businessId: searchParams.get("businessId") ?? undefined,
      stats: searchParams.get("stats") ?? undefined,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const { id, businessId, stats } = parseResult.data;

    if (id && stats === "true") {
      const campaignStats = await getCampaignStats(id);
      return NextResponse.json({ stats: campaignStats });
    }

    if (id) {
      const campaign = await getCampaign(id);
      if (!campaign) {
        return NextResponse.json(
          { error: "Campaign not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({ campaign });
    }

    const campaigns = await getCampaignsByBusiness(businessId!);
    return NextResponse.json({ campaigns, total: campaigns.length });
  } catch (error) {
    log.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = createCampaignSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const { businessId, startsAt, endsAt, ...rest } = parseResult.data;
    const campaign = await createCampaign(businessId, {
      ...rest,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    log.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
