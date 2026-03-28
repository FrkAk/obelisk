import { describe, test, expect, mock } from "bun:test";
import { makePoi, makeRemarkWithPoi } from "@/test/factories";

const mockGetNearbyPois = mock(() => Promise.resolve([makePoi()]));
const mockGetRemarksByPoiIds = mock(() =>
  Promise.resolve([makeRemarkWithPoi()])
);

mock.module("@/lib/db/queries/pois", () => ({
  getAllCategories: mock(() => Promise.resolve([])),
  getNearbyPois: mockGetNearbyPois,
  loadTags: mock(() => Promise.resolve([])),
  loadContactInfo: mock(() => Promise.resolve(null)),
}));
mock.module("@/lib/db/queries/remarks", () => ({
  getRemarksByPoiIds: mockGetRemarksByPoiIds,
  getCurrentRemarkForPoi: mock(() => Promise.resolve(undefined)),
  insertRemark: mock(() => Promise.resolve({})),
  remarkPoiSelect: mock(() => ({})),
  mapRowToRemarkWithPoi: mock(() => ({})),
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

describe("GET /api/remarks", () => {
  test("returns 400 when params are invalid", async () => {
    const request = makeGetRequest("/api/remarks", {
      lat: "not-a-number",
      lon: "11.576",
    });
    const response = await GET(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid parameters");
  });

  test("returns remarks with status 200 for valid params", async () => {
    const request = makeGetRequest("/api/remarks", {
      lat: "48.137",
      lon: "11.576",
      radius: "1000",
    });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.remarks).toHaveLength(1);
    expect(body.total).toBe(1);
  });

  test("returns empty remarks when no nearby POIs exist", async () => {
    mockGetNearbyPois.mockImplementationOnce(() => Promise.resolve([]));
    mockGetRemarksByPoiIds.mockImplementationOnce(() => Promise.resolve([]));

    const request = makeGetRequest("/api/remarks", {
      lat: "48.137",
      lon: "11.576",
      radius: "1000",
    });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.remarks).toEqual([]);
    expect(body.total).toBe(0);
  });
});
