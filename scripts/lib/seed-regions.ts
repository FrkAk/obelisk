/**
 * Seeds the region hierarchy (country → city) for a given location.
 *
 * @module seed-regions
 */

import { db } from "../../src/lib/db/client";
import { regions } from "../../src/lib/db/schema";
import { eq } from "drizzle-orm";
import { createLogger } from "../../src/lib/logger";
import type { LocationConfig } from "./locations";

const log = createLogger("seed-regions");

/**
 * Seeds country and city regions from a location config.
 * Uses onConflictDoNothing so re-runs are safe.
 *
 * @param location - Location preset (e.g. munich, berlin, vienna).
 */
export async function seedRegions(location: LocationConfig): Promise<void> {
  log.info(`Seeding regions for ${location.city.name}...`);

  const [country] = await db
    .insert(regions)
    .values({
      name: location.country.name,
      slug: location.country.slug,
      type: "country",
      locale: location.locale,
      latitude: location.country.lat,
      longitude: location.country.lon,
      timezone: location.timezone,
    })
    .onConflictDoNothing()
    .returning();

  const countryId =
    country?.id ??
    (
      await db
        .select()
        .from(regions)
        .where(eq(regions.slug, location.country.slug))
    ).at(0)?.id;

  if (!countryId) {
    throw new Error(`Failed to resolve ${location.country.name} region ID`);
  }

  await db
    .insert(regions)
    .values({
      name: location.city.name,
      slug: location.city.slug,
      type: "city",
      parentId: countryId,
      locale: location.locale,
      latitude: location.city.lat,
      longitude: location.city.lon,
      timezone: location.timezone,
    })
    .onConflictDoNothing();

  log.success(
    `Regions seeded: ${location.country.name} → ${location.city.name}`,
  );
}
