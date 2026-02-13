import { NextResponse } from "next/server";
import { getAllCategories } from "@/lib/db/queries/pois";
import { createLogger } from "@/lib/logger";

const log = createLogger("categories");

export async function GET() {
  try {
    const categoriesData = await getAllCategories();

    return NextResponse.json({
      categories: categoriesData,
    });
  } catch (error) {
    log.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
