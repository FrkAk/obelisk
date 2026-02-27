import { describe, test, expect } from "bun:test";
import { rankResults } from "@/lib/search/ranking";
import type { RankingInput, SemanticResult } from "@/lib/search/ranking";
import { makeSearchResult } from "@/test/factories";

const MUNICH = { latitude: 48.137154, longitude: 11.576124 };

function makeInput(overrides: Partial<RankingInput> = {}): RankingInput {
  return {
    typesenseResults: [],
    semanticResults: [],
    userLocation: MUNICH,
    maxRadius: 2000,
    ...overrides,
  };
}

function makeSemantic(overrides: Partial<SemanticResult> = {}): SemanticResult {
  return {
    poiId: "sem-001",
    name: "Semantic Place",
    similarity: 0.9,
    latitude: MUNICH.latitude,
    longitude: MUNICH.longitude,
    category: "food",
    ...overrides,
  };
}

describe("rankResults", () => {
  test("empty input returns empty output", () => {
    const results = rankResults(makeInput());
    expect(results).toEqual([]);
  });

  test("single typesense result at rank 0 gets RRF score 1/(10+0) = 0.1", () => {
    const ts = makeSearchResult({ id: "ts-001" });
    const results = rankResults(makeInput({ typesenseResults: [ts] }));
    expect(results).toHaveLength(1);
    expect(results[0].score).toBeCloseTo(0.1, 5);
  });

  test("duplicate IDs across engines merge to higher score", () => {
    const ts = makeSearchResult({ id: "shared-001" });
    const sem = makeSemantic({ poiId: "shared-001", similarity: 1.0 });
    const merged = rankResults(makeInput({
      typesenseResults: [ts],
      semanticResults: [sem],
    }));
    const tsOnly = rankResults(makeInput({ typesenseResults: [ts] }));
    expect(merged[0].score).toBeGreaterThan(tsOnly[0].score);
  });

  test("geo-penalty applied to semantic-only results", () => {
    const farSem = makeSemantic({
      poiId: "far-001",
      distance: 1500,
      similarity: 1.0,
    });
    const results = rankResults(makeInput({
      semanticResults: [farSem],
      maxRadius: 2000,
    }));
    const rrfBase = (1 / 10) * 1.0;
    expect(results[0].score).toBeLessThan(rrfBase);
  });

  test("geo-penalty NOT applied to typesense results", () => {
    const ts = makeSearchResult({ id: "ts-001", distance: 1500 });
    const results = rankResults(makeInput({
      typesenseResults: [ts],
      maxRadius: 2000,
    }));
    expect(results[0].score).toBeCloseTo(0.1, 5);
  });

  test("score cutoff filters results below 50% of top score", () => {
    const top = makeSearchResult({ id: "top-001" });
    const sem = makeSemantic({
      poiId: "weak-001",
      similarity: 0.01,
      distance: 1999,
    });
    const results = rankResults(makeInput({
      typesenseResults: [top],
      semanticResults: [sem],
    }));
    const ids = results.map((r) => r.id);
    expect(ids).toContain("top-001");
    expect(ids).not.toContain("weak-001");
  });

  test("deduplication by ID", () => {
    const ts = makeSearchResult({ id: "dup-001" });
    const sem = makeSemantic({ poiId: "dup-001", similarity: 1.0 });
    const results = rankResults(makeInput({
      typesenseResults: [ts],
      semanticResults: [sem],
    }));
    expect(results.filter((r) => r.id === "dup-001")).toHaveLength(1);
  });

  test("typesenseWeight scales typesense scores", () => {
    const ts = makeSearchResult({ id: "ts-w" });
    const normal = rankResults(makeInput({ typesenseResults: [ts] }));
    const doubled = rankResults(makeInput({
      typesenseResults: [ts],
      typesenseWeight: 2.0,
    }));
    expect(doubled[0].score).toBeCloseTo(normal[0].score * 2, 5);
  });
});
