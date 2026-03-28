import { describe, test, expect } from "bun:test";
import { haversineDistance, geoBounds, isWithinRadius } from "@/lib/geo/distance";

const MARIENPLATZ = { lat: 48.137154, lon: 11.576124 };
const VIKTUALIENMARKT = { lat: 48.135, lon: 11.577 };
const BERLIN = { lat: 52.52, lon: 13.405 };

describe("haversineDistance", () => {
  test("identical points return 0", () => {
    const d = haversineDistance(
      MARIENPLATZ.lat, MARIENPLATZ.lon,
      MARIENPLATZ.lat, MARIENPLATZ.lon,
    );
    expect(d).toBe(0);
  });

  test("Marienplatz to Viktualienmarkt is roughly 200-400m", () => {
    const d = haversineDistance(
      MARIENPLATZ.lat, MARIENPLATZ.lon,
      VIKTUALIENMARKT.lat, VIKTUALIENMARKT.lon,
    );
    expect(d).toBeGreaterThan(200);
    expect(d).toBeLessThan(400);
  });

  test("distance is commutative", () => {
    const ab = haversineDistance(
      MARIENPLATZ.lat, MARIENPLATZ.lon,
      VIKTUALIENMARKT.lat, VIKTUALIENMARKT.lon,
    );
    const ba = haversineDistance(
      VIKTUALIENMARKT.lat, VIKTUALIENMARKT.lon,
      MARIENPLATZ.lat, MARIENPLATZ.lon,
    );
    expect(ab).toBe(ba);
  });
});

describe("geoBounds", () => {
  test("bounds are symmetric around center", () => {
    const b = geoBounds(MARIENPLATZ.lat, MARIENPLATZ.lon, 1000);
    const latDelta = b.maxLat - MARIENPLATZ.lat;
    const lonDelta = b.maxLon - MARIENPLATZ.lon;
    expect(b.minLat).toBeCloseTo(MARIENPLATZ.lat - latDelta, 10);
    expect(b.minLon).toBeCloseTo(MARIENPLATZ.lon - lonDelta, 10);
  });

  test("1000m at Munich latitude gives lat delta ~0.009", () => {
    const b = geoBounds(MARIENPLATZ.lat, MARIENPLATZ.lon, 1000);
    const latDelta = b.maxLat - MARIENPLATZ.lat;
    expect(latDelta).toBeGreaterThan(0.008);
    expect(latDelta).toBeLessThan(0.010);
  });

  test("lon delta is larger than lat delta at Munich latitude", () => {
    const b = geoBounds(MARIENPLATZ.lat, MARIENPLATZ.lon, 1000);
    const latDelta = b.maxLat - MARIENPLATZ.lat;
    const lonDelta = b.maxLon - MARIENPLATZ.lon;
    expect(lonDelta).toBeGreaterThan(latDelta);
  });
});

describe("isWithinRadius", () => {
  test("same point with any radius returns true", () => {
    expect(
      isWithinRadius(MARIENPLATZ.lat, MARIENPLATZ.lon, MARIENPLATZ.lat, MARIENPLATZ.lon, 1),
    ).toBe(true);
  });

  test("distant points with small radius returns false", () => {
    expect(
      isWithinRadius(MARIENPLATZ.lat, MARIENPLATZ.lon, BERLIN.lat, BERLIN.lon, 1000),
    ).toBe(false);
  });
});
