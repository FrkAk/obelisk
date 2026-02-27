import { describe, test, expect, mock } from "bun:test";

const mockFetchPOIDetails = mock(() =>
  Promise.resolve({
    name: "Frauenkirche",
    latitude: 48.1386,
    longitude: 11.5735,
    address: "Frauenplatz 1",
    phone: "+49 89 2900820",
    website: "https://muenchner-dom.de",
    openingHours: "Mo-Su 07:00-19:00",
  })
);

mock.module("@/lib/search/overpass", () => ({
  fetchPOIDetails: mockFetchPOIDetails,
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

import { GET } from "./route";
import { makeGetRequest } from "@/test/helpers";

describe("GET /api/poi/[osmId]", () => {
  test("returns 400 for non-numeric osmId", async () => {
    const request = makeGetRequest("/api/poi/abc");
    const response = await GET(request, {
      params: Promise.resolve({ osmId: "abc" }),
    });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid OSM ID");
  });

  test("returns 200 with details for valid osmId", async () => {
    const request = makeGetRequest("/api/poi/12345");
    const response = await GET(request, {
      params: Promise.resolve({ osmId: "12345" }),
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.osmId).toBe(12345);
    expect(body.osmType).toBe("node");
    expect(body.name).toBe("Frauenkirche");
  });

  test("returns 404 when POI not found", async () => {
    mockFetchPOIDetails.mockImplementationOnce((() => Promise.resolve(null)) as unknown as typeof mockFetchPOIDetails);
    const request = makeGetRequest("/api/poi/99999");
    const response = await GET(request, {
      params: Promise.resolve({ osmId: "99999" }),
    });
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("POI not found");
  });
});
