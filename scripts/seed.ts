/**
 * Unified seeding entry point. Orchestrates regions → cuisines → tags → pois.
 *
 * @example
 * bun scripts/seed.ts                      # all steps
 * bun scripts/seed.ts --step pois          # single step
 * bun scripts/seed.ts --step regions,pois  # multiple steps
 *
 * @module seed
 */

import { createLogger } from "../src/lib/logger";
import { getLocation } from "./lib/locations";
import { seedRegions } from "./lib/seed-regions";
import { seedCuisines } from "./lib/seed-cuisines";
import { seedTags } from "./lib/seed-tags";
import { seedPois } from "./lib/seed-pois";

const log = createLogger("seed");

type Step = "regions" | "cuisines" | "tags" | "pois";

const ALL_STEPS: Step[] = ["regions", "cuisines", "tags", "pois"];

/**
 * Parses --step flag from process.argv.
 *
 * @returns Array of steps to run, or all steps if flag is absent.
 */
function parseSteps(): Step[] {
  const idx = process.argv.indexOf("--step");
  if (idx === -1 || idx + 1 >= process.argv.length) return ALL_STEPS;

  const raw = process.argv[idx + 1].split(",").map((s) => s.trim());
  const valid = new Set<string>(ALL_STEPS);
  const steps: Step[] = [];

  for (const s of raw) {
    if (!valid.has(s)) {
      throw new Error(`Unknown step "${s}". Valid: ${ALL_STEPS.join(", ")}`);
    }
    steps.push(s as Step);
  }

  return steps;
}

/**
 * Runs the seeding pipeline for the configured location and steps.
 */
async function main(): Promise<void> {
  const location = getLocation();
  const steps = parseSteps();

  log.info(
    `Seeding ${location.city.name} (${location.country.name}) — steps: ${steps.join(", ")}`,
  );

  for (const step of steps) {
    switch (step) {
      case "regions":
        await seedRegions(location);
        break;
      case "cuisines":
        await seedCuisines();
        break;
      case "tags":
        await seedTags();
        break;
      case "pois":
        await seedPois(location);
        break;
    }
  }

  log.success("All seed steps complete!");
  process.exit(0);
}

main().catch((error) => {
  log.error("Seeding failed:", error);
  process.exit(1);
});
