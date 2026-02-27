import type { SearchResult } from "@/types/api";

export interface SemanticResult {
  poiId: string;
  osmId?: number;
  name: string;
  similarity: number;
  latitude: number;
  longitude: number;
  category: string;
  distance?: number;
}

export interface RankingInput {
  typesenseResults: SearchResult[];
  semanticResults: SemanticResult[];
  userLocation: { latitude: number; longitude: number };
  maxRadius: number;
  typesenseWeight?: number;
}

const RRF_K = 10;
const MIN_GEO_FACTOR = 0.5;
const SCORE_CUTOFF_RATIO = 0.5;

/**
 * Ranks and fuses results from Typesense and semantic search using Reciprocal Rank Fusion.
 * Typesense results skip geo-penalty since Typesense already sorts by distance.
 * Only semantic results receive geo-penalty.
 *
 * Args:
 *     input: Results from Typesense and semantic search, plus user location and optional typesenseWeight (default 1.0).
 *
 * Returns:
 *     Deduplicated, ranked array of search results.
 */
export function rankResults(input: RankingInput): SearchResult[] {
  const itemMap = new Map<string, SearchResult>();
  const scoreMap = new Map<string, number>();
  const typesenseIds = new Set<string>();

  const typesenseWeight = input.typesenseWeight ?? 1.0;

  for (let rank = 0; rank < input.typesenseResults.length; rank++) {
    const item = input.typesenseResults[rank];
    const rrfScore = (1 / (RRF_K + rank)) * typesenseWeight;
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

  const topScore = ranked[0]?.score ?? 0;
  const minScore = topScore * SCORE_CUTOFF_RATIO;

  const seen = new Set<string>();
  return ranked.filter((item) => {
    if (seen.has(item.id)) return false;
    if (item.score < minScore) return false;
    seen.add(item.id);
    return true;
  });
}
