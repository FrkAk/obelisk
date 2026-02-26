import { db } from "@/lib/db/client";
import { sql } from "drizzle-orm";
import { haversineDistance } from "@/lib/geo/distance";
import { EMBED_MODEL } from "@/lib/ai/ollama";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const MIN_SIMILARITY = 0.35;

interface EmbedResponse {
  embeddings: number[][];
}

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
 * Generates an embedding vector for the given text using Ollama.
 *
 * Args:
 *     text: The text to embed.
 *
 * Returns:
 *     A 768-dimensional embedding vector.
 *
 * Raises:
 *     Error: When the Ollama API call fails.
 */
export async function embedText(text: string): Promise<number[]> {
  const response = await fetch(`${OLLAMA_URL}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: EMBED_MODEL,
      input: text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Ollama embed API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data: EmbedResponse = await response.json();

  if (!data.embeddings || data.embeddings.length === 0) {
    throw new Error("Ollama returned empty embeddings");
  }

  return data.embeddings[0];
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
  const queryEmbedding = await embedText(embeddingText);

  const latDelta = radiusMeters / 111320;
  const lonDelta = radiusMeters / (111320 * Math.cos(latitude * (Math.PI / 180)));

  const minLat = latitude - latDelta;
  const maxLat = latitude + latDelta;
  const minLon = longitude - lonDelta;
  const maxLon = longitude + lonDelta;

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
