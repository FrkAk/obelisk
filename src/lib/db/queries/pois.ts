import { db } from "../client";
import {
  pois,
  categories,
  contactInfo,
  priceInfo,
  tags,
  poiTags,
  cuisines,
  poiCuisines,
  dishes,
  poiDishes,
  foodProfiles,
  historyProfiles,
  architectureProfiles,
  natureProfiles,
  artCultureProfiles,
  nightlifeProfiles,
  shoppingProfiles,
  viewpointProfiles,
  poiTranslations,
  remarks,
} from "../schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import type {
  CategorySlug,
  Tag,
  Cuisine,
  PoiDish,
  Dish,
  ContactInfo as ContactInfoType,
} from "@/types";

/**
 * Fetches POIs within a bounding box around a center point, with category data.
 *
 * Args:
 *     latitude: Center latitude.
 *     longitude: Center longitude.
 *     radiusMeters: Radius in meters to search within.
 *
 * Returns:
 *     Array of POIs with their categories, contact info, and price info.
 */
export async function getNearbyPois(
  latitude: number,
  longitude: number,
  radiusMeters: number = 1000
) {
  const latDelta = radiusMeters / 111320;
  const lonDelta =
    radiusMeters / (111320 * Math.cos(latitude * (Math.PI / 180)));

  const minLat = latitude - latDelta;
  const maxLat = latitude + latDelta;
  const minLon = longitude - lonDelta;
  const maxLon = longitude + lonDelta;

  return db
    .select({
      id: pois.id,
      osmId: pois.osmId,
      name: pois.name,
      categoryId: pois.categoryId,
      latitude: pois.latitude,
      longitude: pois.longitude,
      address: pois.address,
      wikipediaUrl: pois.wikipediaUrl,
      imageUrl: pois.imageUrl,
      osmTags: pois.osmTags,
      createdAt: pois.createdAt,
      category: {
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        icon: categories.icon,
        color: categories.color,
      },
      contact: {
        phone: contactInfo.phone,
        email: contactInfo.email,
        website: contactInfo.website,
        openingHoursRaw: contactInfo.openingHoursRaw,
      },
      price: {
        priceLevel: priceInfo.priceLevel,
        freeEntry: priceInfo.freeEntry,
        currency: priceInfo.currency,
      },
    })
    .from(pois)
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .leftJoin(contactInfo, eq(pois.id, contactInfo.poiId))
    .leftJoin(priceInfo, eq(pois.id, priceInfo.poiId))
    .where(
      and(
        gte(pois.latitude, minLat),
        lte(pois.latitude, maxLat),
        gte(pois.longitude, minLon),
        lte(pois.longitude, maxLon)
      )
    );
}

/**
 * Fetches a single POI by ID with full profile data based on category.
 *
 * Args:
 *     poiId: The POI's UUID.
 *
 * Returns:
 *     The POI with category, contact, price, and profile data, or undefined.
 */
export async function getPoiWithProfile(poiId: string) {
  const baseResults = await db
    .select({
      id: pois.id,
      osmId: pois.osmId,
      name: pois.name,
      categoryId: pois.categoryId,
      regionId: pois.regionId,
      latitude: pois.latitude,
      longitude: pois.longitude,
      address: pois.address,
      locale: pois.locale,
      osmType: pois.osmType,
      osmTags: pois.osmTags,
      wikipediaUrl: pois.wikipediaUrl,
      imageUrl: pois.imageUrl,
      createdAt: pois.createdAt,
      updatedAt: pois.updatedAt,
      category: {
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        icon: categories.icon,
        color: categories.color,
      },
      contact: {
        phone: contactInfo.phone,
        email: contactInfo.email,
        website: contactInfo.website,
        bookingUrl: contactInfo.bookingUrl,
        instagram: contactInfo.instagram,
        facebook: contactInfo.facebook,
        openingHoursRaw: contactInfo.openingHoursRaw,
        openingHoursDisplay: contactInfo.openingHoursDisplay,
      },
      price: {
        priceLevel: priceInfo.priceLevel,
        freeEntry: priceInfo.freeEntry,
        admissionAdult: priceInfo.admissionAdult,
        admissionChild: priceInfo.admissionChild,
        admissionStudent: priceInfo.admissionStudent,
        currency: priceInfo.currency,
        notes: priceInfo.notes,
      },
    })
    .from(pois)
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .leftJoin(contactInfo, eq(pois.id, contactInfo.poiId))
    .leftJoin(priceInfo, eq(pois.id, priceInfo.poiId))
    .where(eq(pois.id, poiId))
    .limit(1);

  const base = baseResults[0];
  if (!base) return undefined;

  const poiTags_ = await db
    .select({
      tagId: tags.id,
      tagName: tags.name,
      tagSlug: tags.slug,
      tagGroup: tags.group,
    })
    .from(poiTags)
    .innerJoin(tags, eq(poiTags.tagId, tags.id))
    .where(eq(poiTags.poiId, poiId));

  const categorySlug = base.category?.slug as CategorySlug | undefined;
  let profile: Record<string, unknown> | null = null;

  if (categorySlug) {
    profile = await fetchProfileByCategory(poiId, categorySlug);
  }

  return { ...base, tags: poiTags_, profile };
}

/**
 * Fetches a single POI by ID with category data.
 *
 * Args:
 *     poiId: The POI's UUID.
 *
 * Returns:
 *     The POI with its category, or undefined.
 */
export async function getPoiById(poiId: string) {
  const results = await db
    .select({
      id: pois.id,
      osmId: pois.osmId,
      name: pois.name,
      categoryId: pois.categoryId,
      latitude: pois.latitude,
      longitude: pois.longitude,
      address: pois.address,
      wikipediaUrl: pois.wikipediaUrl,
      imageUrl: pois.imageUrl,
      osmTags: pois.osmTags,
      createdAt: pois.createdAt,
      category: {
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        icon: categories.icon,
        color: categories.color,
      },
    })
    .from(pois)
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .where(eq(pois.id, poiId))
    .limit(1);

  return results[0];
}

/**
 * Fetches all categories.
 *
 * Returns:
 *     Array of all categories.
 */
export async function getAllCategories() {
  return db.select().from(categories);
}

/**
 * Fetches POIs by category slug with optional profile-specific filtering.
 *
 * Args:
 *     categorySlug: The category slug to filter by.
 *     options: Optional filters like priceLevel, outdoor, etc.
 *
 * Returns:
 *     Array of POIs matching the category and filters.
 */
export async function getPoisByCategory(
  categorySlug: CategorySlug,
  options: {
    limit?: number;
    latitude?: number;
    longitude?: number;
    radiusMeters?: number;
    priceLevel?: number;
    hasOutdoorSeating?: boolean;
  } = {}
) {
  const { limit = 50, latitude, longitude, radiusMeters = 2000, priceLevel, hasOutdoorSeating } = options;

  const conditions = [eq(categories.slug, categorySlug)];

  if (latitude !== undefined && longitude !== undefined) {
    const latDelta = radiusMeters / 111320;
    const lonDelta =
      radiusMeters / (111320 * Math.cos(latitude * (Math.PI / 180)));
    conditions.push(gte(pois.latitude, latitude - latDelta));
    conditions.push(lte(pois.latitude, latitude + latDelta));
    conditions.push(gte(pois.longitude, longitude - lonDelta));
    conditions.push(lte(pois.longitude, longitude + lonDelta));
  }

  const query = db
    .select({
      id: pois.id,
      osmId: pois.osmId,
      name: pois.name,
      categoryId: pois.categoryId,
      latitude: pois.latitude,
      longitude: pois.longitude,
      address: pois.address,
      imageUrl: pois.imageUrl,
      category: {
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        icon: categories.icon,
        color: categories.color,
      },
    })
    .from(pois)
    .innerJoin(categories, eq(pois.categoryId, categories.id))
    .where(and(...conditions))
    .limit(limit);

  const results = await query;

  if (priceLevel === undefined && hasOutdoorSeating === undefined) {
    return results;
  }

  if (categorySlug === "food" && (priceLevel !== undefined || hasOutdoorSeating !== undefined)) {
    const poiIds = results.map((r) => r.id);
    if (poiIds.length === 0) return results;

    const profiles = await db
      .select({
        poiId: foodProfiles.poiId,
        priceLevel: foodProfiles.priceLevel,
        hasOutdoorSeating: foodProfiles.hasOutdoorSeating,
      })
      .from(foodProfiles)
      .where(sql`${foodProfiles.poiId} = ANY(${poiIds})`);

    const profileMap = new Map(profiles.map((p) => [p.poiId, p]));

    return results.filter((r) => {
      const fp = profileMap.get(r.id);
      if (!fp) return false;
      if (priceLevel !== undefined && fp.priceLevel !== priceLevel) return false;
      if (hasOutdoorSeating !== undefined && fp.hasOutdoorSeating !== hasOutdoorSeating) return false;
      return true;
    });
  }

  return results;
}

async function fetchProfileByCategory(
  poiId: string,
  categorySlug: CategorySlug
): Promise<Record<string, unknown> | null> {
  switch (categorySlug) {
    case "food": {
      const r = await db.select().from(foodProfiles).where(eq(foodProfiles.poiId, poiId)).limit(1);
      return (r[0] as Record<string, unknown>) ?? null;
    }
    case "history": {
      const r = await db.select().from(historyProfiles).where(eq(historyProfiles.poiId, poiId)).limit(1);
      return (r[0] as Record<string, unknown>) ?? null;
    }
    case "architecture": {
      const r = await db.select().from(architectureProfiles).where(eq(architectureProfiles.poiId, poiId)).limit(1);
      return (r[0] as Record<string, unknown>) ?? null;
    }
    case "nature": {
      const r = await db.select().from(natureProfiles).where(eq(natureProfiles.poiId, poiId)).limit(1);
      return (r[0] as Record<string, unknown>) ?? null;
    }
    case "art":
    case "culture": {
      const r = await db.select().from(artCultureProfiles).where(eq(artCultureProfiles.poiId, poiId)).limit(1);
      return (r[0] as Record<string, unknown>) ?? null;
    }
    case "nightlife": {
      const r = await db.select().from(nightlifeProfiles).where(eq(nightlifeProfiles.poiId, poiId)).limit(1);
      return (r[0] as Record<string, unknown>) ?? null;
    }
    case "shopping": {
      const r = await db.select().from(shoppingProfiles).where(eq(shoppingProfiles.poiId, poiId)).limit(1);
      return (r[0] as Record<string, unknown>) ?? null;
    }
    case "views": {
      const r = await db.select().from(viewpointProfiles).where(eq(viewpointProfiles.poiId, poiId)).limit(1);
      return (r[0] as Record<string, unknown>) ?? null;
    }
    default:
      return null;
  }
}

/**
 * Loads the category-specific profile for a POI.
 *
 * Args:
 *     poiId: The POI's UUID.
 *     categorySlug: The category slug to determine which profile table to query.
 *
 * Returns:
 *     The profile record, or null if none exists.
 */
export async function loadProfile(
  poiId: string,
  categorySlug: string
): Promise<Record<string, unknown> | null> {
  return fetchProfileByCategory(poiId, categorySlug as CategorySlug);
}

/**
 * Loads all tags associated with a POI.
 *
 * Args:
 *     poiId: The POI's UUID.
 *
 * Returns:
 *     Array of tags, or empty array if none.
 */
export async function loadTags(poiId: string): Promise<Tag[]> {
  return db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      group: tags.group,
      displayOrder: tags.displayOrder,
    })
    .from(poiTags)
    .innerJoin(tags, eq(poiTags.tagId, tags.id))
    .where(eq(poiTags.poiId, poiId));
}

/**
 * Loads all cuisines associated with a POI.
 *
 * Args:
 *     poiId: The POI's UUID.
 *
 * Returns:
 *     Array of cuisines, or empty array if none.
 */
export async function loadCuisines(poiId: string): Promise<Cuisine[]> {
  return db
    .select({
      id: cuisines.id,
      slug: cuisines.slug,
      name: cuisines.name,
      region: cuisines.region,
      parentSlug: cuisines.parentSlug,
      icon: cuisines.icon,
    })
    .from(poiCuisines)
    .innerJoin(cuisines, eq(poiCuisines.cuisineId, cuisines.id))
    .where(eq(poiCuisines.poiId, poiId));
}

/**
 * Loads all dishes offered at a POI with their dish details.
 *
 * Args:
 *     poiId: The POI's UUID.
 *
 * Returns:
 *     Array of POI dishes with nested dish data, or empty array if none.
 */
export async function loadDishes(
  poiId: string
): Promise<Array<PoiDish & { dish: Dish }>> {
  const results = await db
    .select()
    .from(poiDishes)
    .innerJoin(dishes, eq(poiDishes.dishId, dishes.id))
    .where(eq(poiDishes.poiId, poiId));

  return results.map((r) => ({
    ...r.poi_dishes,
    dish: r.dishes,
  }));
}

/**
 * Loads the contact info for a POI.
 *
 * Args:
 *     poiId: The POI's UUID.
 *
 * Returns:
 *     The contact info record, or null if none exists.
 */
export async function loadContactInfo(
  poiId: string
): Promise<ContactInfoType | null> {
  const results = await db
    .select()
    .from(contactInfo)
    .where(eq(contactInfo.poiId, poiId))
    .limit(1);

  return results[0] ?? null;
}

/**
 * Loads translation data (description, reviewSummary) for a POI.
 *
 * Args:
 *     poiId: The POI UUID.
 *     locale: The POI locale for matching translations.
 *
 * Returns:
 *     Object with description and reviewSummary, or null if no translation exists.
 */
export async function loadTranslation(
  poiId: string,
  locale: string,
): Promise<{ description: string | null; reviewSummary: string | null } | null> {
  const results = await db
    .select({
      description: poiTranslations.description,
      reviewSummary: poiTranslations.reviewSummary,
    })
    .from(poiTranslations)
    .where(and(eq(poiTranslations.poiId, poiId), eq(poiTranslations.locale, locale)))
    .limit(1);

  return results[0] ?? null;
}

/**
 * Loads the current remark content for a POI.
 *
 * Args:
 *     poiId: The POI UUID.
 *
 * Returns:
 *     The remark content string, or null if no current remark exists.
 */
export async function loadCurrentRemark(poiId: string): Promise<string | null> {
  const results = await db
    .select({ content: remarks.content })
    .from(remarks)
    .where(and(eq(remarks.poiId, poiId), eq(remarks.isCurrent, true)))
    .limit(1);

  return results[0]?.content ?? null;
}
