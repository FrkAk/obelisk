import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createBusinessAccount,
  getBusinessAccount,
  getBusinessByUserId,
} from "@/lib/db/queries/business";

const createBusinessSchema = z.object({
  userId: z.string().uuid(),
  businessName: z.string().min(1).max(255),
  poiId: z.string().uuid().nullable().optional(),
  contactEmail: z.string().email(),
  contactPhone: z.string().max(30).nullable().optional(),
  billingAddress: z.string().nullable().optional(),
  taxId: z.string().max(50).nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id && !userId) {
      return NextResponse.json(
        { error: "Provide either 'id' or 'userId' query parameter" },
        { status: 400 },
      );
    }

    const account = id
      ? await getBusinessAccount(id)
      : await getBusinessByUserId(userId!);

    if (!account) {
      return NextResponse.json(
        { error: "Business account not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ account });
  } catch (error) {
    console.error("Error fetching business account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = createBusinessSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const { userId, ...data } = parseResult.data;
    const account = await createBusinessAccount(userId, data);

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    console.error("Error creating business account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
