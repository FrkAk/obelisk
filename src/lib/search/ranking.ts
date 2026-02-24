import type { SearchResult } from "./types";

interface SemanticResult {
  poiId: string;
  osmId?: number;
  name: string;
  similarity: number;
  latitude: number;
  longitude: number;
  category: string;
  distance?: number;
}

interface RankingInput {
  typesenseResults: SearchResult[];
  semanticResults: SemanticResult[];
  obeliskResults: SearchResult[];
  userLocation: { latitude: number; longitude: number };
  maxRadius: number;
}

const RRF_K = 10;
const MIN_GEO_FACTOR = 0.5;

/**
 * Ranks and fuses results from multiple search sources using Reciprocal Rank Fusion.
 * Typesense results skip geo-penalty since Typesense already sorts by distance.
 * Only semantic and obelisk-db results receive geo-penalty.
 *
 * Args:
 *     input: Results from Typesense, semantic search, and Obelisk DB, plus user location.
 *
 * Returns:
 *     Deduplicated, ranked array of search results.
 */
export function rankResults(input: RankingInput): SearchResult[] {
  const itemMap = new Map<string, SearchResult>();
  const scoreMap = new Map<string, number>();
  const typesenseIds = new Set<string>();

  for (let rank = 0; rank < input.typesenseResults.length; rank++) {
    const item = input.typesenseResults[rank];
    const rrfScore = 1 / (RRF_K + rank);
    itemMap.set(item.id, item);
    scoreMap.set(item.id, (scoreMap.get(item.id) ?? 0) + rrfScore);
    typesenseIds.add(item.id);
  }

  for (let rank = 0; rank < input.semanticResults.length; rank++) {
    const sem = input.semanticResults[rank];
    const rrfScore = (1 / (RRF_K + rank)) * sem.similarity;
    scoreMap.set(sem.poiId, (scoreMap.get(sem.poiId) ?? 0) + rrfScore);

    if (!itemMap.has(sem.poiId)) {
      itemMap.set(sem.poiId, {
        id: sem.poiId,
        osmId: sem.osmId,
        name: sem.name,
        category: sem.category,
        latitude: sem.latitude,
        longitude: sem.longitude,
        distance: sem.distance,
        score: 0,
        hasStory: false,
        source: "semantic",
      });
    }
  }

  for (let rank = 0; rank < input.obeliskResults.length; rank++) {
    const item = input.obeliskResults[rank];
    const rrfScore = 1 / (RRF_K + rank);
    scoreMap.set(item.id, (scoreMap.get(item.id) ?? 0) + rrfScore);

    if (!itemMap.has(item.id)) {
      itemMap.set(item.id, item);
    } else {
      const existing = itemMap.get(item.id)!;
      if (item.remark && !existing.remark) {
        itemMap.set(item.id, { ...existing, remark: item.remark, hasStory: true });
      }
    }
  }

  const ranked: SearchResult[] = [];
  for (const [id, item] of itemMap) {
    let score = scoreMap.get(id) ?? 0;

    if (!typesenseIds.has(id)) {
      const distance = item.distance ?? input.maxRadius;
      const geoFactor = Math.max(MIN_GEO_FACTOR, 1 - distance / input.maxRadius);
      score *= geoFactor;
    }

    ranked.push({ ...item, score });
  }

  ranked.sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  return ranked.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
