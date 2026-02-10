import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createCampaign,
  getCampaign,
  getCampaignsByBusiness,
  getCampaignStats,
} from "@/lib/db/queries/business";

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
    const id = searchParams.get("id");
    const businessId = searchParams.get("businessId");
    const stats = searchParams.get("stats");

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

    if (businessId) {
      const campaigns = await getCampaignsByBusiness(businessId);
      return NextResponse.json({ campaigns, total: campaigns.length });
    }

    return NextResponse.json(
      { error: "Provide 'id' or 'businessId' query parameter" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error fetching campaigns:", error);
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
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
