import { describe, test, expect } from "bun:test";
import type { CategorySlug } from "@/types";

interface RemarkPoiRow {
  remarkId: string;
  remarkPoiId: string | null;
  remarkTitle: string;
  remarkTeaser: string | null;
  remarkContent: string;
  remarkLocalTip: string | null;
  remarkDurationSeconds: number | null;
  remarkCreatedAt: Date | null;
  remarkLocale: string | null;
  remarkVersion: number;
  remarkIsCurrent: boolean | null;
  remarkModelId: string | null;
  remarkConfidence: string | null;
  poiId: string;
  poiOsmId: number | null;
  poiName: string;
  poiCategoryId: string | null;
  poiLatitude: number;
  poiLongitude: number;
  poiAddress: string | null;
  poiLocale: string;
  poiWikipediaUrl: string | null;
  poiMapillaryId: string | null;
  poiMapillaryBearing: number | null;
  poiMapillaryIsPano: boolean | null;
  poiOsmTags: Record<string, string> | null;
  poiCreatedAt: Date | null;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
}

function mapRowToRemarkWithPoi(row: RemarkPoiRow) {
  return {
    id: row.remarkId,
    poiId: row.remarkPoiId!,
    title: row.remarkTitle,
    teaser: row.remarkTeaser,
    content: row.remarkContent,
    localTip: row.remarkLocalTip,
    durationSeconds: row.remarkDurationSeconds ?? 45,
    createdAt: row.remarkCreatedAt ?? new Date(),
    locale: row.remarkLocale,
    version: row.remarkVersion,
    isCurrent: row.remarkIsCurrent,
    modelId: row.remarkModelId,
    confidence: row.remarkConfidence,
    poi: {
      id: row.poiId,
      osmId: row.poiOsmId,
      name: row.poiName,
      categoryId: row.poiCategoryId!,
      latitude: row.poiLatitude,
      longitude: row.poiLongitude,
      address: row.poiAddress,
      locale: row.poiLocale,
      wikipediaUrl: row.poiWikipediaUrl,
      mapillaryId: row.poiMapillaryId,
      mapillaryBearing: row.poiMapillaryBearing,
      mapillaryIsPano: row.poiMapillaryIsPano,
      osmTags: row.poiOsmTags,
      createdAt: row.poiCreatedAt ?? new Date(),
      category: row.categoryId
        ? {
            id: row.categoryId,
            name: row.categoryName!,
            slug: row.categorySlug! as CategorySlug,
            icon: row.categoryIcon!,
            color: row.categoryColor!,
          }
        : undefined,
    },
  };
}

function makeRow(overrides: Partial<RemarkPoiRow> = {}): RemarkPoiRow {
  return {
    remarkId: "remark-001",
    remarkPoiId: "poi-001",
    remarkTitle: "Test Title",
    remarkTeaser: "Test teaser",
    remarkContent: "Test content about Munich.",
    remarkLocalTip: "Visit in the morning.",
    remarkDurationSeconds: 60,
    remarkCreatedAt: new Date("2025-06-01"),
    remarkLocale: "de-DE",
    remarkVersion: 1,
    remarkIsCurrent: true,
    remarkModelId: "gemma3:4b-it-qat",
    remarkConfidence: "medium",
    poiId: "poi-001",
    poiOsmId: 123456,
    poiName: "Test Wirtshaus",
    poiCategoryId: "cat-food",
    poiLatitude: 48.137154,
    poiLongitude: 11.576124,
    poiAddress: "Marienplatz 1, München",
    poiLocale: "de-DE",
    poiWikipediaUrl: null,
    poiMapillaryId: null,
    poiMapillaryBearing: null,
    poiMapillaryIsPano: null,
    poiOsmTags: null,
    poiCreatedAt: new Date("2025-01-01"),
    categoryId: "cat-food",
    categoryName: "Food & Drink",
    categorySlug: "food",
    categoryIcon: "restaurant",
    categoryColor: "#FF9F9F",
    ...overrides,
  };
}

describe("mapRowToRemarkWithPoi", () => {
  test("maps all fields into nested structure", () => {
    const row = makeRow();
    const result = mapRowToRemarkWithPoi(row);

    expect(result.id).toBe("remark-001");
    expect(result.poiId).toBe("poi-001");
    expect(result.title).toBe("Test Title");
    expect(result.teaser).toBe("Test teaser");
    expect(result.content).toBe("Test content about Munich.");
    expect(result.localTip).toBe("Visit in the morning.");
    expect(result.durationSeconds).toBe(60);
    expect(result.createdAt).toEqual(new Date("2025-06-01"));
    expect(result.version).toBe(1);
    expect(result.isCurrent).toBe(true);
    expect(result.modelId).toBe("gemma3:4b-it-qat");
    expect(result.confidence).toBe("medium");

    expect(result.poi.id).toBe("poi-001");
    expect(result.poi.name).toBe("Test Wirtshaus");
    expect(result.poi.latitude).toBe(48.137154);
    expect(result.poi.longitude).toBe(11.576124);
    expect(result.poi.category).toEqual({
      id: "cat-food",
      name: "Food & Drink",
      slug: "food",
      icon: "restaurant",
      color: "#FF9F9F",
    });
  });

  test("null categoryId produces no category object", () => {
    const row = makeRow({
      categoryId: null,
      categoryName: null,
      categorySlug: null,
      categoryIcon: null,
      categoryColor: null,
    });
    const result = mapRowToRemarkWithPoi(row);
    expect(result.poi.category).toBeUndefined();
  });

  test("null durationSeconds defaults to 45", () => {
    const row = makeRow({ remarkDurationSeconds: null });
    const result = mapRowToRemarkWithPoi(row);
    expect(result.durationSeconds).toBe(45);
  });

  test("null createdAt defaults to a Date", () => {
    const row = makeRow({ remarkCreatedAt: null });
    const result = mapRowToRemarkWithPoi(row);
    expect(result.createdAt).toEqual(expect.any(Date));
  });
});
