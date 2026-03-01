import type {
  Poi,
  PoiProfile,
  Tag,
  ContactInfo,
  SearchResult,
} from "@/types/api";
import type { RemarkWithPoi } from "@/lib/db/queries/remarks";

const MUNICH_LAT = 48.137154;
const MUNICH_LON = 11.576124;

/**
 * Creates a Poi with Munich defaults.
 *
 * @param overrides - Partial Poi fields to override defaults.
 * @returns Complete Poi object.
 */
export function makePoi(overrides: Partial<Poi> = {}): Poi {
  return {
    id: "poi-001",
    osmId: 123456,
    name: "Test Wirtshaus",
    categoryId: "cat-food",
    regionId: null,
    latitude: MUNICH_LAT,
    longitude: MUNICH_LON,
    address: "Marienplatz 1, 80331 München, Germany",
    locale: "de-DE",
    osmType: "node",
    osmTags: null,
    profile: null,
    wikipediaUrl: null,
    imageUrl: null,
    embedding: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: null,
    ...overrides,
  };
}

/**
 * Creates a PoiProfile with empty arrays.
 *
 * @param overrides - Partial PoiProfile fields to override defaults.
 * @returns Complete PoiProfile object.
 */
export function makeProfile(overrides: Partial<PoiProfile> = {}): PoiProfile {
  return {
    keywords: [],
    products: [],
    summary: "",
    enrichmentSource: "test",
    attributes: {},
    ...overrides,
  };
}

/**
 * Creates a Tag.
 *
 * @param overrides - Partial Tag fields to override defaults.
 * @returns Complete Tag object.
 */
export function makeTag(overrides: Partial<Tag> = {}): Tag {
  return {
    id: "tag-001",
    name: "Historic",
    slug: "historic",
    group: "theme",
    displayOrder: 1,
    ...overrides,
  };
}

/**
 * Creates a ContactInfo.
 *
 * @param overrides - Partial ContactInfo fields to override defaults.
 * @returns Complete ContactInfo object.
 */
export function makeContactInfo(
  overrides: Partial<ContactInfo> = {}
): ContactInfo {
  return {
    poiId: "poi-001",
    phone: null,
    email: null,
    website: null,
    bookingUrl: null,
    instagram: null,
    facebook: null,
    openingHoursRaw: null,
    ...overrides,
  };
}

/**
 * Creates a SearchResult.
 *
 * @param overrides - Partial SearchResult fields to override defaults.
 * @returns Complete SearchResult object.
 */
export function makeSearchResult(
  overrides: Partial<SearchResult> = {}
): SearchResult {
  return {
    id: "poi-001",
    name: "Test Wirtshaus",
    category: "food",
    latitude: MUNICH_LAT,
    longitude: MUNICH_LON,
    score: 0.5,
    hasRemark: false,
    source: "typesense",
    ...overrides,
  };
}

/**
 * Creates a nested RemarkWithPoi.
 *
 * @param overrides - Partial fields to override defaults.
 * @returns Complete RemarkWithPoi object.
 */
export function makeRemarkWithPoi(
  overrides: Partial<RemarkWithPoi> = {}
): RemarkWithPoi {
  return {
    id: "remark-001",
    poiId: "poi-001",
    title: "Test Remark Title",
    teaser: "A great remark",
    content: "This is a test remark about a place in Munich.",
    localTip: "Visit at sunset.",
    durationSeconds: 45,
    createdAt: new Date("2025-01-01"),
    locale: "de-DE",
    version: 1,
    isCurrent: true,
    modelId: "gemma3:4b-it-qat",
    confidence: "medium",
    poi: {
      id: "poi-001",
      osmId: 123456,
      name: "Test Wirtshaus",
      categoryId: "cat-food",
      latitude: MUNICH_LAT,
      longitude: MUNICH_LON,
      address: "Marienplatz 1, 80331 München, Germany",
      locale: "de-DE",
      wikipediaUrl: null,
      imageUrl: null,
      osmTags: null,
      createdAt: new Date("2025-01-01"),
      category: {
        id: "cat-food",
        name: "Food & Drink",
        slug: "food",
        icon: "restaurant",
        color: "#FF9F9F",
      },
    },
    ...overrides,
  };
}
