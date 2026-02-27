import { db } from "../client";
import { dishes, poiDishes, pois, cuisines, categories } from "../schema";
import { eq, sql } from "drizzle-orm";

/**
 * Fetches all dishes served at a specific POI with their details.
 *
 * Args:
 *     poiId: The POI's UUID.
 *
 * Returns:
 *     Array of dishes with POI-specific details (price, local name, etc.).
 */
export async function getDishesByPoi(poiId: string) {
  return db
    .select({
      id: poiDishes.id,
      dishId: dishes.id,
      dishSlug: dishes.slug,
      dishName: dishes.name,
      dishNameLocal: dishes.nameLocal,
      dishDescription: dishes.description,
      menuSection: poiDishes.menuSection,
      localName: poiDishes.localName,
      localDescription: poiDishes.localDescription,
      price: poiDishes.price,
      currency: poiDishes.currency,
      isSignature: poiDishes.isSignature,
      isPopular: poiDishes.isPopular,
      isSeasonal: poiDishes.isSeasonal,
      isAvailable: poiDishes.isAvailable,
      isVegetarian: dishes.isVegetarian,
      isVegan: dishes.isVegan,
      isGlutenFree: dishes.isGlutenFree,
      isHalal: dishes.isHalal,
      spicyLevel: dishes.spicyLevel,
      cuisineName: cuisines.name,
      cuisineSlug: cuisines.slug,
    })
    .from(poiDishes)
    .innerJoin(dishes, eq(poiDishes.dishId, dishes.id))
    .leftJoin(cuisines, eq(dishes.cuisineId, cuisines.id))
    .where(eq(poiDishes.poiId, poiId))
    .orderBy(poiDishes.menuSection, dishes.name);
}

/**
 * Searches dishes by name using text matching.
 *
 * Args:
 *     query: Search text.
 *     limit: Maximum number of results.
 *
 * Returns:
 *     Array of matching dishes.
 */
export async function searchDishes(query: string, limit: number = 20) {
  const pattern = `%${query}%`;

  return db
    .select({
      id: dishes.id,
      slug: dishes.slug,
      name: dishes.name,
      nameLocal: dishes.nameLocal,
      description: dishes.description,
      menuSection: dishes.menuSection,
      isVegetarian: dishes.isVegetarian,
      isVegan: dishes.isVegan,
      isGlutenFree: dishes.isGlutenFree,
      isHalal: dishes.isHalal,
      spicyLevel: dishes.spicyLevel,
      cuisineName: cuisines.name,
      cuisineSlug: cuisines.slug,
    })
    .from(dishes)
    .leftJoin(cuisines, eq(dishes.cuisineId, cuisines.id))
    .where(
      sql`${dishes.name} ILIKE ${pattern} OR ${dishes.nameLocal} ILIKE ${pattern}`
    )
    .limit(limit);
}

/**
 * Finds POIs that serve a specific dish by its slug.
 *
 * Args:
 *     dishSlug: The dish slug (e.g., 'wiener-schnitzel').
 *     limit: Maximum number of results.
 *
 * Returns:
 *     Array of POIs serving the dish with price and availability info.
 */
export async function getPoisServingDish(
  dishSlug: string,
  limit: number = 20
) {
  return db
    .select({
      poiId: pois.id,
      poiName: pois.name,
      poiLatitude: pois.latitude,
      poiLongitude: pois.longitude,
      poiAddress: pois.address,
      poiImageUrl: pois.imageUrl,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryColor: categories.color,
      dishId: dishes.id,
      dishName: dishes.name,
      localName: poiDishes.localName,
      price: poiDishes.price,
      currency: poiDishes.currency,
      isSignature: poiDishes.isSignature,
      isPopular: poiDishes.isPopular,
      isAvailable: poiDishes.isAvailable,
    })
    .from(poiDishes)
    .innerJoin(dishes, eq(poiDishes.dishId, dishes.id))
    .innerJoin(pois, eq(poiDishes.poiId, pois.id))
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .where(eq(dishes.slug, dishSlug))
    .limit(limit);
}
