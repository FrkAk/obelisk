import { db } from "@/lib/db/client";
import { sql } from "drizzle-orm";
import { haversineDistance, geoBounds } from "@/lib/geo/distance";
import { embedTexts } from "@/lib/ai/embeddings";

const MIN_SIMILARITY = 0.35;

interface SemanticSearchResult {
  poiId: string;
  osmId?: number;
  name: string;
  latitude: number;
  longitude: number;
  category: string;
  similarity: number;
  distance: number;
}

/**
 * Performs semantic similarity search against POI embeddings in pgvector.
 *
 * Args:
 *     queryText: The natural language query to search for.
 *     latitude: Center latitude for geo filtering.
 *     longitude: Center longitude for geo filtering.
 *     radiusMeters: Search radius in meters.
 *     limit: Maximum number of results.
 *     keywords: Optional keywords to augment the embedding query text.
 *
 * Returns:
 *     Array of POIs ranked by semantic similarity, filtered by geo bounds.
 */
export async function semanticSearch(
  queryText: string,
  latitude: number,
  longitude: number,
  radiusMeters: number,
  limit: number = 10,
  keywords?: string[]
): Promise<SemanticSearchResult[]> {
  const embeddingText = keywords?.length
    ? `${queryText} ${keywords.join(" ")}`
    : queryText;
  const queryEmbedding = (await embedTexts([embeddingText]))[0];

  const { minLat, maxLat, minLon, maxLon } = geoBounds(latitude, longitude, radiusMeters);

  const vectorStr = `[${queryEmbedding.join(",")}]`;

  const rows = await db.execute(sql`
    SELECT
      p.id,
      p.osm_id,
      p.name,
      p.latitude,
      p.longitude,
      COALESCE(c.slug, 'hidden') as category_slug,
      1 - (p.embedding <=> ${vectorStr}::vector) as similarity
    FROM pois p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.embedding IS NOT NULL
      AND p.latitude BETWEEN ${minLat} AND ${maxLat}
      AND p.longitude BETWEEN ${minLon} AND ${maxLon}
      AND 1 - (p.embedding <=> ${vectorStr}::vector) > ${MIN_SIMILARITY}
    ORDER BY p.embedding <=> ${vectorStr}::vector
    LIMIT ${limit}
  `);

  return Array.from(rows).map((row) => {
    const r = row as Record<string, unknown>;
    const lat = Number(r.latitude);
    const lon = Number(r.longitude);
    return {
      poiId: String(r.id),
      osmId: r.osm_id ? Number(r.osm_id) : undefined,
      name: String(r.name),
      latitude: lat,
      longitude: lon,
      category: String(r.category_slug),
      similarity: Number(r.similarity),
      distance: haversineDistance(latitude, longitude, lat, lon),
    };
  });
}
