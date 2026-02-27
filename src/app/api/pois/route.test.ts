import { describe, test, expect, mock } from "bun:test";
import { makePoi } from "@/test/factories";

const mockGetNearbyPois = mock(() => Promise.resolve([makePoi()]));

mock.module("@/lib/db/queries/pois", () => ({
  getAllCategories: mock(() => Promise.resolve([])),
  getNearbyPois: mockGetNearbyPois,
  loadTags: mock(() => Promise.resolve([])),
  loadContactInfo: mock(() => Promise.resolve(null)),
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

describe("GET /api/pois", () => {
  test("returns 400 when lat is invalid", async () => {
    const request = makeGetRequest("/api/pois", {
      lat: "not-a-number",
      lon: "11.576",
    });
    const response = await GET(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid parameters");
  });

  test("returns pois with status 200 for valid params", async () => {
    const request = makeGetRequest("/api/pois", {
      lat: "48.137",
      lon: "11.576",
      radius: "1000",
    });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.pois).toHaveLength(1);
    expect(body.total).toBe(1);
  });

  test("returns 200 with default radius when radius is omitted", async () => {
    const request = makeGetRequest("/api/pois", {
      lat: "48.137",
      lon: "11.576",
    });
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockGetNearbyPois).toHaveBeenCalledWith(48.137, 11.576, 1000);
  });
});
