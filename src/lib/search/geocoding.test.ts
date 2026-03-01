import { describe, test, expect, mock, beforeEach } from "bun:test";

mock.module("@/lib/logger", () => ({
  createLogger: () => ({
    info: () => {},
    success: () => {},
    warn: () => {},
    error: () => {},
    timing: () => {},
  }),
}));

const originalEnv = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

import { geocodeQuery } from "./geocoding";

beforeEach(() => {
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN = originalEnv || "test-token";
});

describe("geocodeQuery", () => {
  test("returns empty array when token is missing", async () => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = "";
    const results = await geocodeQuery("Marienplatz", 48.137, 11.576);
    expect(results).toEqual([]);
  });

  test("returns empty array on fetch failure", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(() => Promise.reject(new Error("Network error")));

    const results = await geocodeQuery("Marienplatz", 48.137, 11.576);
    expect(results).toEqual([]);

    globalThis.fetch = originalFetch;
  });

  test("returns empty array on non-ok response", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(null, { status: 500 }))
    );

    const results = await geocodeQuery("Marienplatz", 48.137, 11.576);
    expect(results).toEqual([]);

    globalThis.fetch = originalFetch;
  });

  test("maps Mapbox features to SearchResult format", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            features: [
              {
                id: "abc123",
                type: "Feature",
                properties: {
                  name: "Marienplatz",
                  full_address: "Marienplatz, 80331 München, Germany",
                  feature_type: "place",
                  coordinates: { latitude: 48.1374, longitude: 11.5755 },
                },
                geometry: {
                  type: "Point",
                  coordinates: [11.5755, 48.1374],
                },
              },
            ],
          }),
          { status: 200 }
        )
      )
    );

    const results = await geocodeQuery("Marienplatz", 48.137, 11.576);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("geo-abc123");
    expect(results[0].name).toBe("Marienplatz");
    expect(results[0].source).toBe("geocoding");
    expect(results[0].hasStory).toBe(false);
    expect(results[0].latitude).toBe(48.1374);
    expect(results[0].longitude).toBe(11.5755);
    expect(results[0].address).toBe("Marienplatz, 80331 München, Germany");
    expect(results[0].placeType).toBe("place");
    expect(results[0].category).toBe("geocoding");

    globalThis.fetch = originalFetch;
  });

  test("uses place_formatted as fallback address", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            features: [
              {
                id: "def456",
                type: "Feature",
                properties: {
                  name: "Sendlinger Tor",
                  place_formatted: "München, Germany",
                  feature_type: "poi",
                  coordinates: { latitude: 48.134, longitude: 11.567 },
                },
                geometry: {
                  type: "Point",
                  coordinates: [11.567, 48.134],
                },
              },
            ],
          }),
          { status: 200 }
        )
      )
    );

    const results = await geocodeQuery("Sendlinger Tor", 48.137, 11.576);

    expect(results[0].address).toBe("München, Germany");

    globalThis.fetch = originalFetch;
  });

  test("constructs correct Mapbox URL with params", async () => {
    const originalFetch = globalThis.fetch;
    let capturedUrl = "";
    globalThis.fetch = mock((url: string) => {
      capturedUrl = url;
      return Promise.resolve(
        new Response(JSON.stringify({ features: [] }), { status: 200 })
      );
    });

    await geocodeQuery("test query", 48.137, 11.576);

    expect(capturedUrl).toContain("api.mapbox.com/search/geocode/v6/forward");
    expect(capturedUrl).toContain("q=test+query");
    expect(capturedUrl).toContain("proximity=11.576%2C48.137");
    expect(capturedUrl).toContain("limit=3");
    expect(capturedUrl).toContain("language=en");
    expect(capturedUrl).not.toContain("bbox");

    globalThis.fetch = originalFetch;
  });
});
