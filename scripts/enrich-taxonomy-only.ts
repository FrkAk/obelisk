import { db } from "../src/lib/db/client";
import { pois } from "../src/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { createLogger } from "../src/lib/logger";
import {
  enrichPoiTaxonomyOnly,
  loadTaxonomyMaps,
  type EnrichPoiRow,
} from "../src/lib/poi/enrichment";
import type { PoiProfile } from "../src/types/api";

const log = createLogger("enrich-taxonomy-only");
const BATCH_SIZE = 200;

/**
 * Fast taxonomy-only enrichment: merges tag/brand maps into POI profiles.
 * No LLM, no network. Runs in seconds for thousands of POIs.
 */
async function main(): Promise<void> {
  const { tagMap, brandMap } = loadTaxonomyMaps();
  log.info(`Loaded taxonomy maps: ${Object.keys(tagMap).length} tags, ${Object.keys(brandMap).length} brands`);

  const unenriched = await db
    .select({
      id: pois.id,
      name: pois.name,
      address: pois.address,
      categoryId: pois.categoryId,
      osmTags: pois.osmTags,
      profile: pois.profile,
    })
    .from(pois)
    .where(sql`${pois.profile}->>'enrichmentSource' = 'seed' OR ${pois.profile} IS NULL`);

  log.info(`Found ${unenriched.length} unenriched POIs`);

  let enriched = 0;

  for (let i = 0; i < unenriched.length; i += BATCH_SIZE) {
    const batch = unenriched.slice(i, i + BATCH_SIZE);

    await db.transaction(async (tx) => {
      for (const row of batch) {
        const poi: EnrichPoiRow = {
          id: row.id,
          name: row.name,
          address: row.address,
          categoryId: row.categoryId,
          osmTags: row.osmTags as Record<string, string> | null,
          profile: row.profile as PoiProfile | null,
        };

        const profile = enrichPoiTaxonomyOnly(poi, tagMap, brandMap);

        await tx
          .update(pois)
          .set({ profile, updatedAt: sql`now()` })
          .where(eq(pois.id, row.id));

        enriched++;
      }
    });

    log.info(`Enriched ${Math.min(i + BATCH_SIZE, unenriched.length)}/${unenriched.length}`);
  }

  log.info(`Done: ${enriched} POIs enriched with taxonomy data`);
  process.exit(0);
}

main().catch((err) => {
  log.error(`Fatal: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
