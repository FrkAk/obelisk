/**
 * Location registry for multi-city seeding.
 *
 * @module locations
 */

export interface LocationConfig {
  city: { name: string; slug: string; lat: number; lon: number };
  country: { name: string; slug: string; lat: number; lon: number };
  locale: string;
  timezone: string;
  pbfUrl: string;
  pbfFilename: string;
  seedRadius: number;
}

const LOCATIONS: Record<string, LocationConfig> = {
  munich: {
    city: { name: "Munich", slug: "munich", lat: 48.137154, lon: 11.576124 },
    country: { name: "Germany", slug: "germany", lat: 51.1657, lon: 10.4515 },
    locale: "de-DE",
    timezone: "Europe/Berlin",
    pbfUrl: "https://download.bbbike.org/osm/bbbike/Muenchen/Muenchen.osm.pbf",
    pbfFilename: "Muenchen.osm.pbf",
    seedRadius: -1,
  },
  berlin: {
    city: { name: "Berlin", slug: "berlin", lat: 52.52, lon: 13.405 },
    country: { name: "Germany", slug: "germany", lat: 51.1657, lon: 10.4515 },
    locale: "de-DE",
    timezone: "Europe/Berlin",
    pbfUrl: "https://download.bbbike.org/osm/bbbike/Berlin/Berlin.osm.pbf",
    pbfFilename: "Berlin.osm.pbf",
    seedRadius: -1,
  },
  vienna: {
    city: { name: "Vienna", slug: "vienna", lat: 48.2082, lon: 16.3738 },
    country: { name: "Austria", slug: "austria", lat: 47.5162, lon: 14.5501 },
    locale: "de-AT",
    timezone: "Europe/Vienna",
    pbfUrl: "https://download.bbbike.org/osm/bbbike/Wien/Wien.osm.pbf",
    pbfFilename: "Wien.osm.pbf",
    seedRadius: -1,
  },
};

/**
 * Resolves the active location from the SEED_LOCATION env var.
 * Falls back to "munich" when unset. SEED_RADIUS env overrides the preset radius.
 *
 * @returns Resolved LocationConfig.
 * @throws If SEED_LOCATION is set to an unknown slug.
 */
export function getLocation(): LocationConfig {
  const slug = (process.env.SEED_LOCATION ?? "munich").toLowerCase();
  const location = LOCATIONS[slug];

  if (!location) {
    const valid = Object.keys(LOCATIONS).join(", ");
    throw new Error(`Unknown SEED_LOCATION "${slug}". Valid options: ${valid}`);
  }

  const radiusOverride = process.env.SEED_RADIUS;
  if (radiusOverride) {
    return { ...location, seedRadius: parseInt(radiusOverride, 10) };
  }

  return location;
}
