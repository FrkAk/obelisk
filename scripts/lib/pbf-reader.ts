/**
 * Reads POIs from local OSM PBF extract files, applying tag filters
 * and geographic radius constraints.
 *
 * @module pbf-reader
 */

import { isWithinRadius } from "../../src/lib/geo/distance";
import type { OverpassElement } from "../../src/types/api";
import { createLogger } from "../../src/lib/logger";

const log = createLogger("pbf-reader");

// Bun defines globalThis.self which causes osm-read to use the browser code
// path (XMLHttpRequest) instead of Node.js (fs + zlib). Temporarily removing
// self forces the correct detection.
const savedSelf = globalThis.self;
// @ts-expect-error — temporarily remove self for osm-read browser detection
delete globalThis.self;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const osmRead = require("osm-read") as { parse: (opts: import("osm-read").ParseOptions) => void };
globalThis.self = savedSelf;

const osmParse = osmRead.parse;

interface TagFilter {
  key: string;
  value?: string;
}

interface OsmNode {
  id: string;
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

interface OsmWay {
  id: string;
  tags: Record<string, string>;
  nodeRefs: string[];
}

const TAG_FILTERS: TagFilter[] = [
  { key: "amenity", value: "restaurant" },
  { key: "amenity", value: "cafe" },
  { key: "amenity", value: "bar" },
  { key: "amenity", value: "pub" },
  { key: "amenity", value: "fast_food" },
  { key: "amenity", value: "biergarten" },
  { key: "amenity", value: "ice_cream" },
  { key: "amenity", value: "food_court" },
  { key: "amenity", value: "theatre" },
  { key: "amenity", value: "cinema" },
  { key: "tourism", value: "museum" },
  { key: "tourism", value: "gallery" },
  { key: "amenity", value: "library" },
  { key: "amenity", value: "community_centre" },
  { key: "amenity", value: "nightclub" },
  { key: "amenity", value: "hospital" },
  { key: "amenity", value: "pharmacy" },
  { key: "amenity", value: "clinic" },
  { key: "amenity", value: "doctors" },
  { key: "amenity", value: "dentist" },
  { key: "amenity", value: "bank" },
  { key: "amenity", value: "post_office" },
  { key: "amenity", value: "police" },
  { key: "amenity", value: "fire_station" },
  { key: "amenity", value: "university" },
  { key: "amenity", value: "school" },
  { key: "amenity", value: "college" },
  { key: "amenity", value: "kindergarten" },
  { key: "tourism", value: "hotel" },
  { key: "tourism", value: "hostel" },
  { key: "tourism", value: "guest_house" },
  { key: "tourism", value: "attraction" },
  { key: "tourism", value: "artwork" },
  { key: "tourism", value: "viewpoint" },
  { key: "tourism", value: "information" },
  { key: "historic" },
  { key: "leisure", value: "park" },
  { key: "leisure", value: "garden" },
  { key: "leisure", value: "nature_reserve" },
  { key: "leisure", value: "sports_centre" },
  { key: "leisure", value: "stadium" },
  { key: "leisure", value: "fitness_centre" },
  { key: "leisure", value: "swimming_pool" },
  { key: "leisure", value: "pitch" },
  { key: "leisure", value: "playground" },
  { key: "shop" },
  { key: "healthcare" },
  { key: "amenity", value: "place_of_worship" },
  { key: "amenity", value: "bus_station" },
  { key: "railway", value: "station" },
  { key: "railway", value: "tram_stop" },
  { key: "natural" },
];

/**
 * Checks whether an OSM element's tags match at least one tag filter.
 *
 * @param tags - The element's OSM tag dictionary.
 * @returns True if the element matches at least one filter.
 */
function matchesFilters(tags: Record<string, string>): boolean {
  for (const filter of TAG_FILTERS) {
    if (filter.value === undefined) {
      if (tags[filter.key] !== undefined) return true;
    } else {
      if (tags[filter.key] === filter.value) return true;
    }
  }
  return false;
}

/**
 * Reads POIs from a local OSM PBF extract file, filtered by tag criteria
 * and geographic radius.
 *
 * @param filePath - Path to the .osm.pbf file.
 * @param center - Center point { lat, lon } for radius filtering.
 * @param radiusMeters - Radius in meters from center to include POIs.
 * @returns Array of OverpassElement objects matching the tag filters within radius.
 */
export async function readPoisFromPbf(
  filePath: string,
  center: { lat: number; lon: number },
  radiusMeters: number,
): Promise<OverpassElement[]> {
  const nodeCoords = new Map<string, { lat: number; lon: number }>();
  const matchedNodes: OverpassElement[] = [];
  const matchedWays: OverpassElement[] = [];

  return new Promise((resolve, reject) => {
    osmParse({
      filePath,

      node(node: OsmNode) {
        nodeCoords.set(node.id, { lat: node.lat, lon: node.lon });

        if (!node.tags || !node.tags.name) return;
        if (!matchesFilters(node.tags)) return;
        if (!isWithinRadius(center.lat, center.lon, node.lat, node.lon, radiusMeters)) return;

        matchedNodes.push({
          type: "node",
          id: parseInt(node.id, 10),
          lat: node.lat,
          lon: node.lon,
          tags: node.tags,
        });
      },

      way(way: OsmWay) {
        if (!way.tags || !way.tags.name) return;
        if (!matchesFilters(way.tags)) return;

        let totalLat = 0;
        let totalLon = 0;
        let count = 0;

        for (const ref of way.nodeRefs) {
          const coord = nodeCoords.get(ref);
          if (coord) {
            totalLat += coord.lat;
            totalLon += coord.lon;
            count++;
          }
        }

        if (count === 0) return;

        const centerLat = totalLat / count;
        const centerLon = totalLon / count;

        if (!isWithinRadius(center.lat, center.lon, centerLat, centerLon, radiusMeters)) return;

        matchedWays.push({
          type: "way",
          id: parseInt(way.id, 10),
          center: { lat: centerLat, lon: centerLon },
          tags: way.tags,
        });
      },

      endDocument() {
        log.info(`PBF: ${matchedNodes.length} nodes + ${matchedWays.length} ways = ${matchedNodes.length + matchedWays.length} POIs`);
        log.info(`PBF: ${nodeCoords.size} total nodes indexed for way centroids`);
        nodeCoords.clear();
        resolve([...matchedNodes, ...matchedWays]);
      },

      error(err: Error) {
        reject(err);
      },
    });
  });
}
