import { db } from "../src/lib/db/client";
import { regions } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Seeds the region hierarchy: Germany -> Munich.
 */
async function main() {
  console.log("Seeding regions...");

  const [germany] = await db
    .insert(regions)
    .values({
      name: "Germany",
      slug: "germany",
      type: "country",
      locale: "de-DE",
      latitude: 51.1657,
      longitude: 10.4515,
      timezone: "Europe/Berlin",
    })
    .onConflictDoNothing()
    .returning();

  const germanyId =
    germany?.id ??
    (await db.select().from(regions).where(eq(regions.slug, "germany"))
    ).at(0)?.id;

  if (!germanyId) {
    console.error("Failed to resolve Germany region ID");
    process.exit(1);
  }

  await db
    .insert(regions)
    .values({
      name: "Munich",
      slug: "munich",
      type: "city",
      parentId: germanyId,
      locale: "de-DE",
      latitude: 48.137154,
      longitude: 11.576124,
      timezone: "Europe/Berlin",
    })
    .onConflictDoNothing();

  console.log("Regions seeded: Germany -> Munich");
  process.exit(0);
}

main().catch((error) => {
  console.error("Region seeding failed:", error);
  process.exit(1);
});
