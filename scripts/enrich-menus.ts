import { db } from "../src/lib/db/client";
import {
  pois,
  categories,
  contactInfo,
  dishes,
  poiDishes,
  enrichmentLog,
} from "../src/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { webSearch } from "../src/lib/web/webSearch";
import { scrapeMenuPage } from "../src/lib/web/scraper";
import { extractMenuDishes } from "../src/lib/enrichment/extractors";
import type { MenuDishExtraction } from "../src/lib/enrichment/extractors";
import { createLogger } from "../src/lib/logger";

const log = createLogger("enrich-menus");

const BATCH_SIZE = 3;
const BATCH_DELAY_MS = 3000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractCity(address?: string | null): string {
  if (!address) return "Munich";
  const parts = address.split(",").map((p) => p.trim());
  if (parts.length >= 2) {
    const cityPart = parts[parts.length - 2];
    return cityPart.replace(/^\d{4,5}\s*/, "").trim() || "Munich";
  }
  return "Munich";
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[äÄ]/g, "ae")
    .replace(/[öÖ]/g, "oe")
    .replace(/[üÜ]/g, "ue")
    .replace(/[ß]/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

async function hasRecentMenuEnrichment(
  poiId: string,
  hoursAgo: number = 72,
): Promise<boolean> {
  const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  const rows = await db
    .select({ id: enrichmentLog.id })
    .from(enrichmentLog)
    .where(
      and(
        eq(enrichmentLog.poiId, poiId),
        eq(enrichmentLog.source, "menu_scrape"),
        sql`${enrichmentLog.createdAt} > ${cutoff.toISOString()}`,
      ),
    )
    .limit(1);
  return rows.length > 0;
}

async function logMenuEnrichment(
  poiId: string,
  status: string,
  fieldsUpdated: string[],
  metadata: Record<string, unknown>,
): Promise<void> {
  await db.insert(enrichmentLog).values({
    poiId,
    source: "menu_scrape",
    status,
    fieldsUpdated,
    metadata,
  });
}

// ---------------------------------------------------------------------------
// Dish upsert
// ---------------------------------------------------------------------------

async function findOrCreateDish(
  extracted: MenuDishExtraction,
): Promise<string> {
  const slug = slugify(extracted.name);

  const existing = await db
    .select({ id: dishes.id })
    .from(dishes)
    .where(eq(dishes.slug, slug))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  const [newDish] = await db
    .insert(dishes)
    .values({
      slug,
      name: extracted.name,
      nameLocal: extracted.local_name ?? null,
      description: extracted.description ?? null,
      menuSection: extracted.menu_section ?? null,
      isVegetarian: extracted.is_vegetarian ?? null,
      isVegan: extracted.is_vegan ?? null,
      isGlutenFree: extracted.is_gluten_free ?? null,
      containsPork: extracted.contains_pork ?? null,
      containsAlcohol: extracted.contains_alcohol ?? null,
      spicyLevel: extracted.spicy_level ?? null,
    })
    .returning({ id: dishes.id });

  return newDish.id;
}

async function upsertPoiDish(
  poiId: string,
  dishId: string,
  extracted: MenuDishExtraction,
  sourceUrl: string | null,
): Promise<boolean> {
  const existing = await db
    .select({ id: poiDishes.id })
    .from(poiDishes)
    .where(and(eq(poiDishes.poiId, poiId), eq(poiDishes.dishId, dishId)))
    .limit(1);

  if (existing.length > 0) {
    return false;
  }

  await db.insert(poiDishes).values({
    poiId,
    dishId,
    localName: extracted.local_name ?? extracted.name,
    localDescription: extracted.description ?? null,
    price: extracted.price ? String(extracted.price) : null,
    currency: extracted.currency ?? "EUR",
    menuSection: extracted.menu_section ?? null,
    isSignature: false,
    isPopular: false,
    isSeasonal: false,
    source: "scraped",
    sourceUrl,
    confidence: 60,
  });

  return true;
}

// ---------------------------------------------------------------------------
// Enrich a single food POI's menu
// ---------------------------------------------------------------------------

async function enrichPoiMenu(poi: {
  id: string;
  name: string;
  address: string | null;
  website: string[] | null;
}): Promise<{ dishesAdded: number; status: string }> {
  const { id, name, address, website } = poi;
  const city = extractCity(address);
  const primaryWebsite = website?.[0] ?? null;

  let menuText = "";
  let menuSourceUrl: string | null = null;

  if (primaryWebsite) {
    const menuVariants = [
      primaryWebsite.replace(/\/$/, "") + "/menu",
      primaryWebsite.replace(/\/$/, "") + "/speisekarte",
      primaryWebsite,
    ];

    for (const url of menuVariants) {
      const content = await scrapeMenuPage(url);
      if (!content.error && content.mainContent && content.mainContent.length > 100) {
        menuText = content.mainContent;
        menuSourceUrl = url;
        break;
      }
    }
  }

  if (!menuText) {
    const searchQuery = `${name} ${city} menu speisekarte`;
    const results = await webSearch(searchQuery, 3);

    for (const result of results) {
      const content = await scrapeMenuPage(result.url);
      if (
        !content.error &&
        content.mainContent &&
        content.mainContent.length > 100
      ) {
        menuText = content.mainContent;
        menuSourceUrl = result.url;
        break;
      }
    }
  }

  if (!menuText) {
    await logMenuEnrichment(id, "failed", [], {
      reason: "no_menu_found",
    });
    return { dishesAdded: 0, status: "failed" };
  }

  const extractedDishes = await extractMenuDishes(menuText, name);

  if (extractedDishes.length === 0) {
    await logMenuEnrichment(id, "partial", [], {
      reason: "extraction_empty",
      menuTextLength: menuText.length,
      sourceUrl: menuSourceUrl,
    });
    return { dishesAdded: 0, status: "partial" };
  }

  let dishesAdded = 0;

  for (const extracted of extractedDishes) {
    try {
      const dishId = await findOrCreateDish(extracted);
      const wasNew = await upsertPoiDish(id, dishId, extracted, menuSourceUrl);
      if (wasNew) dishesAdded++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      log.warn(`Failed to upsert dish "${extracted.name}" for ${name}: ${msg}`);
    }
  }

  await logMenuEnrichment(
    id,
    dishesAdded > 0 ? "success" : "partial",
    [`poi_dishes:${dishesAdded}`, `dishes:${extractedDishes.length}`],
    {
      sourceUrl: menuSourceUrl,
      extractedCount: extractedDishes.length,
      insertedCount: dishesAdded,
    },
  );

  return { dishesAdded, status: "success" };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  log.info("Starting menu enrichment pipeline...");

  const foodCategory = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, "food"))
    .limit(1);

  if (foodCategory.length === 0) {
    log.error("Food category not found in database");
    process.exit(1);
  }

  const foodCategoryId = foodCategory[0].id;

  const foodPois = await db
    .select({
      id: pois.id,
      name: pois.name,
      address: pois.address,
      website: contactInfo.website,
    })
    .from(pois)
    .leftJoin(contactInfo, eq(pois.id, contactInfo.poiId))
    .where(eq(pois.categoryId, foodCategoryId))
    .orderBy(pois.name);

  log.info(`Found ${foodPois.length} food POIs to process`);

  let enriched = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < foodPois.length; i += BATCH_SIZE) {
    const batch = foodPois.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(foodPois.length / BATCH_SIZE);

    log.info(`Batch ${batchNum}/${totalBatches}`);

    for (const poi of batch) {
      if (await hasRecentMenuEnrichment(poi.id)) {
        skipped++;
        continue;
      }

      try {
        const result = await enrichPoiMenu({
          id: poi.id,
          name: poi.name,
          address: poi.address,
          website: poi.website,
        });

        if (result.status === "success") {
          enriched++;
          log.success(
            `[${enriched + failed + skipped}/${foodPois.length}] ${poi.name} (+${result.dishesAdded} dishes)`,
          );
        } else {
          failed++;
          log.warn(
            `[${enriched + failed + skipped}/${foodPois.length}] ${poi.name}: ${result.status}`,
          );
        }
      } catch (error) {
        failed++;
        const message =
          error instanceof Error ? error.message : "Unknown error";
        log.error(
          `[${enriched + failed + skipped}/${foodPois.length}] ${poi.name}: ${message}`,
        );
      }
    }

    if (i + BATCH_SIZE < foodPois.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  log.info("");
  log.info(
    `Menu enrichment complete: ${enriched} enriched, ${failed} failed, ${skipped} skipped`,
  );
  process.exit(failed > foodPois.length / 2 ? 1 : 0);
}

main().catch((error) => {
  log.error("Menu enrichment pipeline failed:", error);
  process.exit(1);
});
