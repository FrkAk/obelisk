import { describe, test, expect, mock } from "bun:test";
import { makeRemarkWithPoi } from "@/test/factories";

const mockRemarkPoiSelect = mock(() => ({}));
const mockMapRowToRemarkWithPoi = mock(() => makeRemarkWithPoi());

const mockGeoBounds = mock(() => ({
  minLat: 48.136,
  maxLat: 48.138,
  minLon: 11.575,
  maxLon: 11.577,
}));

const selectChain = {
  from: mock(() => selectChain),
  leftJoin: mock(() => selectChain),
  innerJoin: mock(() => selectChain),
  where: mock(() => selectChain),
  limit: mock(() => Promise.resolve([])),
};

mock.module("@/lib/db/client", () => ({ db: { select: mock(() => selectChain) } }));
mock.module("@/lib/db/schema", () => ({
  pois: { id: "id", name: "name", categoryId: "categoryId", latitude: "latitude", longitude: "longitude", address: "address", wikipediaUrl: "wikipediaUrl", imageUrl: "imageUrl", osmTags: "osmTags", osmId: "osmId", createdAt: "createdAt" },
  remarks: { id: "id", poiId: "poiId", isCurrent: "isCurrent" },
  categories: { id: "id", name: "name", slug: "slug" },
}));
mock.module("@/lib/db/queries/remarks", () => ({
  remarkPoiSelect: mockRemarkPoiSelect,
  mapRowToRemarkWithPoi: mockMapRowToRemarkWithPoi,
}));
mock.module("@/lib/geo/distance", () => ({
  geoBounds: mockGeoBounds,
}));
mock.module("@/lib/geo/categories", () => ({
  getCategorySlug: mock(() => "hidden"),
  OSM_CATEGORY_MAP: {} as Record<string, string>,
}));
mock.module("drizzle-orm", () => ({
  eq: (...args: unknown[]) => args,
  and: (...args: unknown[]) => args,
  gte: (...args: unknown[]) => args,
  lte: (...args: unknown[]) => args,
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

const mockFetch = mock(() => Promise.resolve(new Response())) as unknown as typeof fetch;
globalThis.fetch = mockFetch;

import { POST } from "./route";
import { makePostRequest } from "@/test/helpers";

describe("POST /api/poi/lookup", () => {
  test("returns 400 when name is missing", async () => {
    const request = makePostRequest("/api/poi/lookup", {
      latitude: 48.137,
      longitude: 11.576,
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid parameters");
  });

  test("returns database source when POI found in DB", async () => {
    const dbPoi = {
      id: "poi-001",
      osmId: 123456,
      name: "Hofbräuhaus",
      categoryId: "cat-food",
      latitude: 48.137,
      longitude: 11.576,
      address: "Platzl 9",
      wikipediaUrl: null,
      imageUrl: null,
      osmTags: null,
      createdAt: new Date("2025-01-01"),
      categoryName: "Food & Drink",
      categorySlug: "food",
    };

    selectChain.where.mockImplementationOnce((() =>
      Promise.resolve([dbPoi])
    ) as unknown as typeof selectChain.where);
    selectChain.limit.mockImplementationOnce((() => Promise.resolve([])) as unknown as typeof selectChain.limit);

    const request = makePostRequest("/api/poi/lookup", {
      name: "Hofbräuhaus",
      latitude: 48.137,
      longitude: 11.576,
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.source).toBe("database");
    expect(body.poi.name).toBe("Hofbräuhaus");
  });

  test("returns nominatim source when DB misses but Nominatim finds it", async () => {
    selectChain.where.mockImplementationOnce((() => Promise.resolve([])) as unknown as typeof selectChain.where);

    (mockFetch as unknown as ReturnType<typeof mock>).mockImplementationOnce(() =>
      Promise.resolve(
        new Response(
          JSON.stringify([
            {
              place_id: 999,
              osm_id: 789,
              osm_type: "node",
              name: "Marienplatz",
              type: "attraction",
              class: "tourism",
              lat: "48.137",
              lon: "11.576",
              display_name: "Marienplatz, Altstadt, Munich, Bavaria",
              extratags: {},
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );

    const request = makePostRequest("/api/poi/lookup", {
      name: "Marienplatz",
      latitude: 48.137,
      longitude: 11.576,
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.source).toBe("nominatim");
    expect(body.remark).toBeNull();
  });

  test("returns synthetic source when all lookups fail", async () => {
    selectChain.where.mockImplementationOnce((() => Promise.resolve([])) as unknown as typeof selectChain.where);

    (mockFetch as unknown as ReturnType<typeof mock>).mockImplementationOnce(() =>
      Promise.resolve(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    const request = makePostRequest("/api/poi/lookup", {
      name: "Unknown Place",
      latitude: 48.137,
      longitude: 11.576,
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.source).toBe("synthetic");
    expect(body.remark).toBeNull();
    expect(body.poi.name).toBe("Unknown Place");
  });
});
