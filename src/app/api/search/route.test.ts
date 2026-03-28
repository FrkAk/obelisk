import { describe, test, expect, mock } from "bun:test";
import { makeRemarkWithPoi } from "@/test/factories";

const mockParseQueryIntent = mock(() =>
  Promise.resolve({
    category: "food",
    keywords: ["pizza"],
    filters: {},
    source: "fast-path" as const,
  })
);
const mockGeocodeQuery = mock(() => Promise.resolve([]));
const mockSearchPOIs = mock(() =>
  Promise.resolve([
    {
      poiId: "poi-001",
      osmId: 123456,
      name: "Test Wirtshaus",
      category: "food",
      location: [48.137, 11.576] as [number, number],
      textScore: 0.95,
      address: "Marienplatz 1",
      description: "A bavarian pub",
      cuisines: ["german"],
      amenityType: "restaurant",
      hasRemark: false,
      hasOutdoorSeating: true,
      hasWifi: false,
    },
  ])
);
const mockSemanticSearch = mock(() => Promise.resolve([]));
const mockGetRandomRemark = mock(() => Promise.resolve(undefined));
const mockRankResults = mock((input: { typesenseResults: unknown[] }) =>
  input.typesenseResults
);

mock.module("@/lib/search/queryParser", () => ({
  parseQueryIntent: mockParseQueryIntent,
}));
mock.module("@/lib/search/geocoding", () => ({
  geocodeQuery: mockGeocodeQuery,
}));
mock.module("@/lib/search/typesense", () => ({
  searchPOIs: mockSearchPOIs,
  searchAutocomplete: mock(() => Promise.resolve([])),
}));
mock.module("@/lib/search/semantic", () => ({
  semanticSearch: mockSemanticSearch,
}));
mock.module("@/lib/db/queries/search", () => ({
  getRandomRemark: mockGetRandomRemark,
}));
mock.module("@/lib/search/ranking", () => ({
  rankResults: mockRankResults,
}));
mock.module("@/lib/geo/distance", () => ({
  haversineDistance: mock(() => 500),
  geoBounds: mock(() => ({
    minLat: 48,
    maxLat: 49,
    minLon: 11,
    maxLon: 12,
  })),
  isWithinRadius: mock(() => true),
}));
mock.module("@/lib/logger", () => ({
  createLogger: () => ({
    info: () => {},
    success: () => {},
    warn: () => {},
    error: () => {},
    timing: () => {},
  }),
}));

import { POST } from "./route";
import { makePostRequest } from "@/test/helpers";

const validBody = {
  query: "pizza near me",
  location: { latitude: 48.137, longitude: 11.576 },
  radius: 5000,
};

describe("POST /api/search", () => {
  test("returns 400 for invalid body", async () => {
    const request = makePostRequest("/api/search", { query: "" });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid request");
  });

  test("returns random remark for discovery query", async () => {
    (mockParseQueryIntent as ReturnType<typeof mock>).mockImplementationOnce(() =>
      Promise.resolve({
        isDiscovery: true,
        category: "discovery",
        keywords: [],
        filters: {},
        source: "fast-path" as const,
      })
    );
    const remark = makeRemarkWithPoi();
    (mockGetRandomRemark as ReturnType<typeof mock>).mockImplementationOnce(() => Promise.resolve(remark));

    const request = makePostRequest("/api/search", {
      query: "surprise me",
      location: { latitude: 48.137, longitude: 11.576 },
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.results).toHaveLength(1);
    expect(body.results[0].hasRemark).toBe(true);
    expect(body.timing).toBeDefined();
  });

  test("returns fused results for normal query", async () => {
    const request = makePostRequest("/api/search", validBody);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.results.length).toBeGreaterThanOrEqual(1);
    expect(body.intent).toBeDefined();
    expect(body.timing).toBeDefined();
    expect(body.timing.totalMs).toBeGreaterThanOrEqual(0);
  });

  test("returns empty results when both engines fail", async () => {
    mockSearchPOIs.mockImplementationOnce(() =>
      Promise.reject(new Error("Typesense down"))
    );
    mockSemanticSearch.mockImplementationOnce(() =>
      Promise.reject(new Error("pgvector down"))
    );
    mockRankResults.mockImplementationOnce(() => []);

    const request = makePostRequest("/api/search", validBody);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.results).toEqual([]);
  });
});
